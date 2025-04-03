# EARTHQUAKE DATA COMPARATOR

This project uses Puppeteer to scrape earthquake data from the [GlobalCMT](https://www.globalcmt.org) website and then saves the extracted data to an Excel file using `xlsx`.

<p align="center">
  <img src="https://res.cloudinary.com/nitishk72/image/upload/blog/javascript/javascript-default.png" alt="Logo" height="300">

## Features
- Scrapes earthquake data from a specific webpage.
- Processes and extracts details of each earthquake, such as date, time, latitude, longitude, depth, and magnitude.
- Generates an Excel file with the extracted data.

## Requirements
 - [Node](https://nodejs.org/en/download/current) (Recommended: LTS version)
- [Visual Studio Code](https://code.visualstudio.com/) or [Visual Studio](https://visualstudio.microsoft.com/)

## Dependencies

This project depends on the following libraries:

- `puppeteer`: For browser automation and data scraping.
- `xlsx`: For generating Excel files from the processed data.

## Installation

1. Clone the repository from GitHub and navigate to the directory executing the following commands in your command prompt:

   ```bash
   git clone https://github.com/funktasthic/earthquake-data-comparator.git
   cd earthquake-data-comparator
   ```
2. Install the dependencies using the command:
    ```bash
    npm i
    ```

3. Execute the application using the command:

    ```bash
    npm run dev
    ```

## Authors

- [@funktasthic](https://www.github.com/funktasthic)
