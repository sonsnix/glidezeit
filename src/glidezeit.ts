
import * as Plotly from "plotly.js";

const apiURL = "https://node.windy.com/forecast/meteogram";
const pressureLevels = [1000.0, 950.0, 925.0, 900.0, 850.0, 800.0, 700.0, 600.0, 500.0, 400.0, 300.0, 200.0, 150.0];
const skew = 35.0;

const pressureLevelsText: string[] = [];
const temperatures: number[] = [];
const dewPoints: number[] = [];
const ts = 0;

function setup() {

    pressureLevels.forEach((v, i) => {pressureLevelsText[i] = v.toString() + "h"; });
    loadMeteoData(apiURL + "/ecmwf" + "/47.412/12.245");

}

function loadMeteoData(url: string) {
    fetch(url).then((response) => {
        processMeteoData(response.json());
    });
}

function processMeteoData(response: any) {
    const data = response.data;

    pressureLevelsText.forEach((v, i) => {
        temperatures[i] = data["temp-" + v][ts] - 273.15;
        dewPoints[i] = data["dewpoint-" + v][ts] - 273.15;
    });

    plotMeteoData();
}

function plotMeteoData() {

    const temperaturePlot: any[] = [];
    const dewPointPlot: any[] = [];
    const isothermPlots: any[] = [];
    let plots: any[] = [];

    // prepare plot dataType

    // isotherm
    const isotherms = [-100, -80, -60, -40, -20, 0, 20, 40, 60];
    isotherms.forEach((isotherm, j) => {
        const isothermPlot: any[] = [];
        pressureLevels.forEach((pl, i) => {
            isothermPlot[i] = [isotherm + skew * Math.log(pressureLevels[0] / pl), pl];
        });
        isothermPlots.push({
            data: isothermPlot,
            lineStyle: {color: "#aca"},
            name: "isotherm" + j,
            showSymbol: false,
            type: "line",
        });
    });

    plots = plots.concat(isothermPlots);

    pressureLevels.forEach((pl, i) => {
        temperaturePlot[i] = [temperatures[i] + skew * Math.log(pressureLevels[0] / pl), pl];
    });

    plots.push({
        data: temperaturePlot,
        lineStyle: {color: "#c33"},
        name: "temperature",
        type: "line",
    });

    pressureLevels.forEach((pl, i) => {
        dewPointPlot[i] = [dewPoints[i] + skew * Math.log(pressureLevels[0] / pl), pl];
    });

    plots.push({
        data: dewPointPlot,
        lineStyle: {color: "#33c"},
        name: "dew point",
        type: "line",
    });

    const maxTemperature = Math.max.apply(Math, temperaturePlot.map((v) => {
      return v[0];
    }));
    console.log(temperaturePlot);

    const trace1: Plotly.Data[] = [{x: [1, 2], y: [1, 2], type: "scatter"}];
    const myPlot = Plotly.plot("chart", trace1);

}
