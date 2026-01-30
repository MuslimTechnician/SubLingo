<p align="center">
  <img src="public/icon.png" width="128" alt="SubLingo Logo">
</p>

<h1 align="center">SubLingo</h1>

<p align="center">Subtitles that speak your language</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-blue?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-6.2-purple?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css" alt="Tailwind">
  <img src="https://img.shields.io/badge/Gemini-6366f1?logo=google" alt="Gemini AI">
</p>

## About

SubLingo is a web app that generates subtitles for videos using AI.
You upload a video, generate subtitles, preview them with the video player, and export them as an SRT file.

The app does **not** ship with an AI service included.
You must use **your own API key** to generate subtitles.


## Features

* Generate subtitles from uploaded videos
* Same-language subtitle generation
* Subtitle translation option
* Built-in video player with subtitle support
* Download subtitles as `.srt`
* Upload and preview existing subtitle files
* Light and dark theme support


## Usage

1. Open the app.
2. In the popup, paste your Gemini API key and click **Save Settings** (or first-time setup).
3. Select a video file to upload.
4. Choose a subtitle mode:

   * **Same Language Subtitles** → Click this to generate subtitles in the video’s original audio language.
   * **Translated Subtitles** → Select a **Target Language** from the dropdown and click this to generate translated subtitles.
5. Wait for processing.
6. After generation, you can view the subtitles in the **Transcript** section, play the video with subtitles, or download the generated subtitles as an **SRT** file.



## License

See the **LICENSE** file for license details.