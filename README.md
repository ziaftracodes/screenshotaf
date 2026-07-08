# screenshotaf

A fully offline, Node.js CLI tool to automatically capture full-page screenshots of web projects. It requires no external APIs, sends no telemetry, and runs 100% locally.

## Features

- **Project Detection:** Automatically identifies whether your project is a single-page app, static HTML site, or requires a dev server (like React, Next.js, or Vite).
- **Auto-Discovery:** Crawls your running application starting from the homepage to find all reachable routes automatically.
- **Scroll-Capture Loop:** Instead of one long stitched image, it captures pages into sequential screenshot files corresponding to each viewport height.
- **Multi-Device Capture:** Captures each page across Mobile (390x844), Tablet (768x1024), and Laptop (1440x900) views at 2x retina pixel density.
- **Load Readiness:** Guarantees web fonts, lazy-loaded images, and entrance animations have settled before capturing screenshots.
- **Clean Execution:** Automatically starts your project's dev server and safely shuts it down when finished.

## Usage

1. Drop the `screenshotaf` directory wherever you'd like.
2. To run the tool on a project:
   - **Windows:** Open the terminal in `screenshotaf` folder and run `run.bat`. It takes the current directory as the project target.
   - **Mac/Linux:** Open a terminal and run:
     ```bash
     npm install
     node index.js /path/to/your/project
     ```

## Output Structure

The output will be placed in the directory where you ran the tool, named with a timestamp.

```text
myapp-2026-07-08_14-32-10/
  home/
    mobile/
      page-1.png
      page-2.png
    tablet/
      page-1.png
    laptop/
      page-1.png
      page-2.png
      page-3.png
  about/
    mobile/
      page-1.png
    tablet/
      page-1.png
    laptop/
      page-1.png
```

## Known Limitations
* The crawling feature will only discover pages that are explicitly linked within the application using an `<a>` tag.
* Fully dynamic routes or pages without visible entry points (e.g., `/admin` or `/dashboard/hidden-id`) will not be captured automatically. This is expected behavior.
