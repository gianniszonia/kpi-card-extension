# KPI Card Extension

`KPI Card Extension` is a Tableau Viz Extension that turns a measure and a date field into a configurable KPI card with rich formatting and multiple chart widgets.

The extension is hosted through GitHub Pages and can be distributed to the community using the included `.trex` manifest.

## Included Files

- `KPICard-Community.trex`: Shareable Tableau extension manifest
- `kpi-card.html`: Main extension entrypoint
- `kpi-card.js`: Extension logic
- `config-dialog.html`: Formatting dialog UI
- `config-dialog.js`: Formatting dialog logic
- `fonts/`: Local font assets used by the extension
- `lib/`: Tableau Extensions API library

## Install In Tableau

1. Download `KPICard-Community.trex` from this repository.
2. In a Tableau worksheet, click the marks card drop down and click `Add Extension`.
3. Choose `Access Local Viz Extensions`.
4. Select the downloaded `KPICard-Community.trex` file.
5. Configure the extension by assigning:
   - a `Measure`
   - a `Date`
6. Use the extension menu to open the formatting dialog and customize the card.

## Hosted Extension URL

The extension loads from:

`https://gianniszonia.github.io/kpi-card-extension/kpi-card.html`

## Notes

- The extension is intended for Tableau environments that support Viz Extensions.
- The repository contains supporting documentation files, including the privacy policy and terms of service.
- The extension does not collect, store, or transmit any user data. All data displayed in the extension comes directly from the Tableau worksheet it is connected to and is never read, copied, or processed outside of your Tableau environment.
- If you prefer, you can download the files from this repository and host the extension yourself for additional peace of mind around data security and deployment control.
- GitHub Pages may take a short time to refresh after updates are pushed.

## Support

For questions or feedback, or if you build something cool with the extension, connect with me on LinkedIn:

- https://www.linkedin.com/in/yiannis-zonia/
