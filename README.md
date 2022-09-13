# _'Title'_

#### A simple note-taking web application. Accessible from `master` at its [GitHub Page](https://totalchris.github.io/title).

## Vision

> #### _tl;dr: I'm just trying to make a good app that does what the big boys do._

- Create a simple note-taking app and push as many boundaries of that app as humanly possible using cutting edge web tech. 
- Test frequently across modern rendering engines to ensure compatibility on every device. 
- Create a minimum-viable-product that would compete with Google Keep, Bundled Notes, and Apple Notes in a scenario where I care enough to do so.

## Precautions

> #### _tl;dr: This is a pet project made by a washed-up 22-year-old as a hobby. Use at your own risk._

Using the app at this stage in development is a risk you knowingly take. The browser you use Title in stores your data. I don't see your data and therefore assume no responsibility for it.

When I update Title on `master` the app may act unintentionally or clear your data. If you want, you can export your notes in json format using the "Export Data" button in the Folders menu, and re-import it using the "Import Data" button. 

Ideally, only UI components will break update-to-update and your data will be accessible unless you clear the browser data yourself.

## Current Features

- Create plaintext notes with a title and checkbox to reflect "completion" of that entry
- Create folders of those notes, with thier own name and color
- Rename/delete notes or folders as desired
- Automatically save folders and their notes on exit
- Import and Export user data to a plain json file when desired

## Flaws / To-Do

- Css is spaghetti, needs sass or other preprocessor
- Element IDs don't match current naming scheme

## Feature Roadmap

- [x] Implement jQuery to organize element events/references
- [x] Implement standard UI framework for cleaner look (Bootstrap)
- [x] Add color support to notes
- [x] Add color support to folders
- [ ] Add icon support to folders
- [x] Export/Import data as file
- [ ] Offline use support
- [ ] Implement history api to use back + forward nav
- [ ] Add dark mode or other themes
- [ ] Support other types of data in notes (richtext, images, etc.)
