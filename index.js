import puppeteer from "puppeteer";
import xlsx from "xlsx";

async function launchBrowser() {
    // Launch the browser
    return puppeteer.launch({ headless: false, slowMo: 100 });
}

async function scrapeData() {
    // Scrape and process the earthquake data from GLOBALCMT
    const browser = await launchBrowser();
    const page = await browser.newPage();

    try {
        // Navigate to the page and extract data
        await page.goto("https://www.globalcmt.org/cgi-bin/globalcmt-cgi-bin/CMT5/form?itype=ymd&yr=1976&mo=1&day=1&otype=ymd&oyr=2024&omo=1&oday=1&jyr=1976&jday=1&ojyr=1976&ojday=1&nday=1&lmw=0&umw=10&lms=0&ums=10&lmb=0&umb=10&llat=-25&ulat=-21&llon=-74&ulon=-67&lhd=0&uhd=1000&lts=-9999&uts=9999&lpe1=0&upe1=90&lpe2=0&upe2=90&list=0");

        // Extract raw data from the page
        const rawData = await page.evaluate(() => {
            const preElements = Array.from(document.querySelectorAll("pre"));
            return [preElements[1]?.innerText || "", preElements[6]?.innerText || ""];
        });

        // Process data
        const data = rawData
            .map(entry => {
                if (!entry) return null;
                const lines = entry.split("\n").map(line => line.trim());

                // Extract date and time
                const dateMatch = lines[0].match(/Date:\s(\d{4})\/\s*(\d{1,2})\/(\d{1,2})/);
                const [year, month, day] = dateMatch ? dateMatch.slice(1).map(Number) : [0, 0, 0];

                // Extract time
                const timeMatch = lines[0].match(/Centroid Time:\s([\d:.]+)\sGMT/);
                const [hour, minutes, seconds] = timeMatch ? timeMatch[1].split(":").map(Number) : [0, 0, 0];

                // Extract earthquake details
                const latitude = parseFloat((lines[1].match(/Lat=\s*(-?\d+\.\d+)/) || [])[1] || 0);
                const longitude = parseFloat((lines[1].match(/Lon=\s*(-?\d+\.\d+)/) || [])[1] || 0);
                const depth = parseFloat((lines[2].match(/Depth\s*=\s*([\d.]+)/) || [])[1] || 0);
                const mwMagnitude = parseFloat((lines[5].match(/Mw\s=\s(\d+\.\d+)/) || [])[1] || 0);
                const mbMagnitude = parseFloat((lines[5].match(/mb\s=\s(\d+\.\d+)/) || [])[1] || 0);

                return { year, month, day, hour, minutes, seconds, latitude, longitude, depth, mwMagnitude, mbMagnitude };
            })
            .filter(Boolean);

        // Print raw and processed data
        console.log("Raw data: ", rawData);
        console.log("Scraped data: ", data);
        return data;

    } finally {
        await browser.close();
    }
}

function generateExcelFile(data) {
    // Generate Excel file from the data
    const wb = xlsx.utils.book_new();
    const sheetData = data.map(({ year, month, day, hour, minutes, seconds, latitude, longitude, depth, mwMagnitude, mbMagnitude }) => ({
        year: year.toString(), 
        month: month.toString(), 
        day: day.toString(), 
        hour: hour.toString(), 
        minutes: minutes.toString(), 
        seconds: seconds.toString(), 
        latitude, 
        longitude, 
        depth, 
        mwMagnitude, 
        mbMagnitude
    }));
    // Add data to the sheet
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(sheetData), "Earthquake Data");
    xlsx.writeFile(wb, "earthquake_data.xlsx");
}

async function main() {
    // Main function to execute all processes
    try {
        const earthquakeData = await scrapeData();
        generateExcelFile(earthquakeData);
        console.log("Data saved in Excel.");
    } catch (error) {
        console.error("Error in scraping or generating Excel:", error);
    }
}

main();
