# CUMV Specimen Collection Map App

Interactive web app for visualizing CUMV specimen localities through time using `cumv_localities_all.csv`.

## Live Site

https://debrito-victor.github.io/cumv-map/

## Run locally (Windows)

1. Open PowerShell in the project folder
2. Install dependencies:
   `npm install`
3. Start the app:
   `npm start`

## Included files

- `index.html`: App layout (header/logo, controls, map, line chart)
- `style.css`: White-background museum-style design
- `main.js`: CSV parsing, collection grouping, animation controls, map + cumulative chart updates
- `package.json`: Local start script

## Controls

- `Play / Pause` for year-by-year animation
- Speed: `Slow`, `Medium`, `Fast`
- Year navigation: `First Year`, `-1 Year`, `+1 Year`, `+5 Years`, `+10 Years`, `Last Year`
- Slider: drag to any year and update immediately

## AI-Generated Code Disclosure

This repository contains code generated with the assistance of artificial intelligence, primarily GPT-5.3-Codex (OpenAI). The applications were developed through natural language prompts, which were used to generate, refine, debug, and optimize the codebase.

All generated code was reviewed, tested, modified, and curated by the author before deployment and publication. The author is responsible for the final implementation, functionality, and maintenance of the software.

The repository is distributed under the MIT License.
