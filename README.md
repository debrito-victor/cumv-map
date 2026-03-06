# CUMV Specimen Collection Map App

Interactive web app for visualizing CUMV specimen localities through time using `cumv_localities_all.csv`.

## Run locally (Windows)

1. Open PowerShell in this project folder:
   `c:\Users\vd248\Documents\CUMV_map_app`
2. Install dependencies:
   `npm install`
3. Start the app:
   `npm start`
4. Open:
   `http://localhost:3000`

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
