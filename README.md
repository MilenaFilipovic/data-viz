# Data Visualization Project
Project for Data visualization (COM-480) course @ EPFL.

You can access the visualization [here](https://milenafilipovic.github.io/data-viz/app/)

You can access the screencast  [here](https://youtu.be/leMp6A_hgWI)

## Overview
The goal of this project is to analyze the GitHub users’ behavior, explore relations among overall programming language usage and the overlaps in the different languages that programmers use. We also want to show how this changes over time, taking into account monthly activity from February 2011 to the present day.  
For this project just PRs will be analysed.
 
## How to run the application
In order to run this project you must have `npm` installed in your machine. Then run:
```bash
npm install
npm start
```
The last command should spin a new browser tab in http://localhost:8080.


## How to get and process the data
First of all, build and activate python virtual env for this application, run:
```bash
bash grab_data/bootstrap-python-env.sh
source data-viz-env/bin/activate
```

- To download the data, processing and save you must have installed `python3`. Before to run, you must modify the dates in the file `grab_data/download-data.sh` and then:
```bash
bash grab_data/download-data.sh
``` 
- To aggregate the data and get the individual and aggregated metrics, run:
```bash
python3 grab_data/src/grab_data/aggregate.py <start-date> <end-date>
``` 

- To build the network, run:
```bash
python3 grab_data/src/grab_data/network_matrix.py <start-date> <end-date> <ntop-languages>
``` 
The `ntop-languages` is the number of languages considered, note that the processing order is exponential, so be careful to choose this parameter. 

All scripts will check if you have downloaded all the necessary data to build the metrics and the files will be saved in the folder `data`.
Note that for the application the folder used is `app/data` so you must move manually the files to this new folder.

## TODOs

- Bundle Edges
- Put information language ranking for each metric
- Smooth the mouveover dots and also show the `geral mean` for each chart
- Remove line labels from the top and put in charts
- Refactor application code
  
