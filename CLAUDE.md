# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a thesis project exploring drug policy strictness visualization through an interactive scrollytelling website. The project examines the relationship between drug policy enforcement (particularly cocaine) and seizure data across different countries.

## Architecture

### Core Files Structure
- `index.html` - Main scrollytelling webpage with story sections and interactive dashboard
- `strictness.html` - Dedicated page for the cocaine policy strictness index
- `cocaine_seizures.html` - Page focused on cocaine seizure data visualization
- `lawinbooks.html` - Page about law enforcement dimensions ("law in books" vs reality)
- `javascript/main.js` - Main JavaScript file handling scrolling, navigation, and dashboard interactions
- `css/main.css` - Styling for the main pages with minimalist black/white design aesthetic

### Data Files
- `data/seizures_cocaine_filtered.csv` - Main dataset (tracked with Git LFS)
- `lawinbooks.md` - Content describing the "Law in Books" dimension of drug policy measurement
- `seizurerate.ipynb` - Jupyter notebook for data analysis

### Design Philosophy
- Minimalist black and white aesthetic with clean typography
- Helvetica/Arial font stack throughout
- Heavy use of black borders and white backgrounds
- Scrollytelling approach with fixed navigation and progress tracking

## Key Features

### Main Page (index.html)
- **Scrollytelling Structure**: Story mode with multiple sections (intro, supply chain, background, legal framework, strictness index, case studies)
- **Interactive Dashboard**: Data layer selection, time slider (2010-2024), country comparison tools
- **Navigation**: Story mode vs Dashboard toggle, smooth scrolling between sections
- **Progress Bar**: Tracks scroll progress through the story

### Data Visualization Components
- Built for D3.js v7 integration (library loaded via CDN)
- Placeholder sections for network visualizations, maps, and comparative charts
- Interactive controls for data layer selection (prevalence, flow maps, strictness index, crime data)
- Country comparison interface (Sweden, Portugal, Colombia, USA focus)

### Styling Patterns
- Consistent use of 1px black borders
- 2rem padding standard
- Intersection Observer for scroll animations
- Backdrop blur effects on fixed navigation
- Responsive design with max-width containers

## Development Notes

### No Build System
- Pure HTML/CSS/JavaScript - no package.json or build tools
- Direct D3.js CDN integration
- Static file serving sufficient for development

### Git LFS Usage
- Large CSV data files are tracked with Git LFS (.gitattributes configured)
- Must have Git LFS installed when cloning/pulling data files

### Cross-Page Consistency
- All pages follow similar header/navigation structure
- Consistent styling approach across HTML files
- Each page focuses on specific aspect of drug policy analysis

## Data Context

This project analyzes drug policy effectiveness through multiple dimensions:
1. **Law in Books**: Legal framework and criminalization levels
2. **Implementation**: How policies are actually enforced
3. **Supply Chain Impact**: From cultivation to distribution
4. **Country Comparisons**: Different policy approaches (strict vs. harm reduction)

The visualizations aim to show correlations between policy strictness and seizure data to evaluate enforcement effectiveness.