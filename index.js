import puppeteer from "puppeteer";
import xlsx from "xlsx";

async function launchBrowser() {
    // Launch the browser
    return puppeteer.launch({ headless: false, slowMo: 100 });
}

async function scrapeData() {
    // Open the browser and set the page to navigate to
    const browser = await launchBrowser();
    const page = await browser.newPage();
    // Stores data in an earthquake array
    const allEarthquakeData = [];

    try {
        // Navigate to the GLOBALCMT page
        await page.goto("https://www.globalcmt.org/cgi-bin/globalcmt-cgi-bin/CMT5/form?itype=ymd&yr=1976&mo=1&day=1&otype=ymd&oyr=2024&omo=1&oday=1&jyr=1976&jday=1&ojyr=1976&ojday=1&nday=1&lmw=0&umw=10&lms=0&ums=10&lmb=0&umb=10&llat=-25&ulat=-21&llon=-74&ulon=-67&lhd=0&uhd=1000&lts=-9999&uts=9999&lpe1=0&upe1=90&lpe2=0&upe2=90&list=0");

        // Initialize page number and the 'has more pages' flag
        let pageNumber = 1;
        let hasMorePages = true;

        console.log("Starting data extraction...");

        // Loop through pages while there are more pages to scrape
        while (hasMorePages) {
            console.log(`Processing page ${pageNumber}...`);

            // Wait for the pre tag and extract data from the page
            await page.waitForSelector("pre");
            const pageData = await extractPageData(page);
            // Process the data and add to the allEarthquakeData array
            allEarthquakeData.push(...pageData);

            console.log(`Page: ${pageNumber}: ${pageData.length} records extracted. Total records: ${allEarthquakeData.length}`);

            // Try navigating to the next page by clicking the 'More solutions' link
            try {
                const nextPageClicked = await page.evaluate(() => {
                    const links = Array.from(document.querySelectorAll("a"));
                    const moreSolutionsLink = links.find(link => 
                        link.textContent.includes("More solutions")
                    );
                    if (moreSolutionsLink) {
                        // Click the link to go to the next page
                        moreSolutionsLink.click();
                        return true;
                    }
                    return false;
                });

                if (nextPageClicked) {
                    // Wait for the page to load and increment the page number
                    await page.waitForNavigation({ waitUntil: "networkidle0", timeout: 10000 });
                    pageNumber++;
                } else {
                    // No more pages to navigate to
                    hasMorePages = false;
                }
            } catch (error) {
                console.log("Error navigating: ", error.message);
                hasMorePages = false;
            }
        }

        console.log(`Data extraction completed. Total records: ${allEarthquakeData.length}`);
        return allEarthquakeData;

    } finally {
        // Close the browser after extraction
        await browser.close();
        console.log("Browser closed.");
    }
}

async function extractPageData(page) {
    // Extract and proccess data from the actual page
    const rawData = await page.evaluate(() => {
        const preElements = Array.from(document.querySelectorAll("pre"));
        return preElements.slice(1).map(pre => pre.innerText.trim());
    });

    return rawData.map(entry => {
        const lines = entry.split("\n").map(line => line.trim());

        const dateMatch = lines[0]?.match(/Date:\s*(\d{4})\s*\/\s*(\d{1,2})\s*\/\s*(\d{1,2})/);
        const [year, month, day] = dateMatch ? dateMatch.slice(1).map(Number) : [null, null, null];

        const timeMatch = lines[0]?.match(/Centroid Time:\s*(\d{1,2})\s*:\s*(\d{1,2})\s*:\s*(\d{1,2}(?:\.\d+)?)/);
        console.log("Time match:", timeMatch);
        const [hour, minutes, seconds] = timeMatch ? timeMatch.slice(1).map(Number) : [null, null, null];

        const latitude = parseFloat((lines[1]?.match(/Lat=\s*(-?\d+\.\d+)/) || [])[1] || "0");
        const longitude = parseFloat((lines[1]?.match(/Lon=\s*(-?\d+\.\d+)/) || [])[1] || "0");
        const depth = parseFloat((lines[2]?.match(/Depth\s*=\s*([\d.]+)/) || [])[1] || "0");
        const mwMagnitude = parseFloat((lines[5]?.match(/Mw\s=\s(\d+\.\d+)/) || [])[1] || "0");

        return { year, month, day, hour, minutes, seconds, latitude, longitude, depth, mwMagnitude };
    });
}


function generateExcelFile(data, filename = "earthquake_data.xlsx") {
    // Save data to an Excel file
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    // Add data to the sheet
    xlsx.utils.book_append_sheet(wb, ws, "Earthquake Data");
    xlsx.writeFile(wb, filename);
    console.log(`File saved: ${filename}`);
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