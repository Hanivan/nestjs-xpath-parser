# Changelog

## [0.6.2](https://github.com/Hanivan/nestjs-xpath-parser/compare/v0.6.1...v0.6.2) (2026-06-27)


### Bug Fixes

* **module:** include HttpModule in forRootAsync imports and fix LIBXMLJS typo in spec ([8189578](https://github.com/Hanivan/nestjs-xpath-parser/commit/8189578e5752fcee1e823291b0c471c34a68dc65))

## [0.6.1](https://github.com/Hanivan/nestjs-xpath-parser/compare/v0.6.0...v0.6.1) (2026-06-26)


### Bug Fixes

* **html-parser:** resolve relative pagination URLs against base URL ([3deef93](https://github.com/Hanivan/nestjs-xpath-parser/commit/3deef93f2fe36af6aedac94630a23db22cd98fa9))

# [0.6.0](https://github.com/Hanivan/nestjs-xpath-parser/compare/v0.5.0...v0.6.0) (2026-06-26)


### Features

* **pipes:** add v1-compatible pipe registry with 10 new pipe types ([3657307](https://github.com/Hanivan/nestjs-xpath-parser/commit/3657307527e9e1e8946148dcbd1476baa091c1f6))

# [0.5.0](https://github.com/Hanivan/nestjs-xpath-parser/compare/v0.4.0...v0.5.0) (2026-06-26)


### Features

* add mode option to evaluateWebsite for raw HTML access ([ea8f303](https://github.com/Hanivan/nestjs-xpath-parser/commit/ea8f30376a0e6d93acc79ae22a2eed09d31fa34e))

# [0.4.0](https://github.com/Hanivan/nestjs-xpath-parser/compare/v0.3.3...v0.4.0) (2026-06-23)


### Features

* add CleanHtmlPipe, normalizeHtml option, and pagination support ([36c089e](https://github.com/Hanivan/nestjs-xpath-parser/commit/36c089e9e6d5d3abf10124b2ee3c22a97dd22fec))

## [0.3.3](https://github.com/Hanivan/nestjs-xpath-parser/compare/v0.3.1...v0.3.3) (2026-05-28)

## [0.3.2](https://github.com/Hanivan/nestjs-xpath-parser/compare/v0.3.1...v0.3.2) (2026-05-28)

## [0.3.1](https://github.com/Hanivan/nestjs-xpath-parser/compare/v0.3.0...v0.3.1) (2026-05-22)

# [0.3.0](https://github.com/Hanivan/nestjs-xpath-parser/compare/v0.2.1...v0.3.0) (2026-05-22)


### Features

* integrate CycleTLS fingerprinting support for enhanced web scraping ([61ade22](https://github.com/Hanivan/nestjs-xpath-parser/commit/61ade2220427504b6b7f9e348c54fa53ebd3dbcb))

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-01-16

### Added

- Add retag option to versioning script for improved tag management

### Changed

- Update tsconfig.json and enhance version script
- Enhance versioning script for improved tag management and cross-platform compatibility
- Update CHANGELOG.md for version 0.2.1

## [0.2.0] - 2026-01-16

### Added

- Introduce custom pipes and enhance data transformation capabilities

### Changed

- Enhance custom pipes with improved logic and documentation

## [0.1.3] - 2026-01-15

### Added

- Enhance configuration options for ScraperHtmlService
- Add URL health check functionality
- Add release script for automated version tagging and GitHub releases
- Add release script to package.json and update versioning documentation
- Restructure and enhance HTML scraping module
- Implement type safety improvements and refactor ScraperHtmlService

### Changed

- Update .npmignore and tsconfig.build.json for improved build configuration
- Update package version to 0.1.0 in package.json
- Update project configuration and enhance documentation
- Update README to include new URL health check example
- Remove example scripts and documentation for HTML Parser API
- Rename package and update references from scraper to parser
- Remove deprecated HTML parser integration tests
- Enhance pattern handling and improve console output formatting
- Rename publish script in package.json for clarity
- Update package version to 0.1.1 in package.json
- Update package version to 0.1.2 in package.json
- Bump version to 0.1.3
