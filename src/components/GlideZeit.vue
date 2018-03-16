<template>
    <v-app>
        <v-toolbar color="indigo" dark fixed app>
            <v-toolbar-title>GlideZeit</v-toolbar-title>
        </v-toolbar>
        
        <v-content>
            <v-container grid-list-md fluid fill-height>
                <v-layout row justify-center align-center>

                    <v-flex md8 d-flex fill-height>
                        <v-card fill-height>
                            <div id="skew-chart" style="width:100%;height:100%">
                            </div>
                        </v-card>
                    </v-flex>
                    <v-flex md4 d-flex fill-height>
                        <v-card fill-height>
                            <v-card-title primary-title>
                                <h3 class="headline mb-0">Settings</h3>
                            </v-card-title>
                            
                            <v-subheader>Forecast Location & Model</v-subheader>
                            <v-card-text>
                                <v-select label="Location" v-model="fcLocation" :items="fcLocations"/>
                                <v-select label="Model" v-model="fcModel" :items="fcModels"/>
                            </v-card-text>

                            <v-btn @click="requestForecastData">Get FC</v-btn>

                            <v-subheader>Time</v-subheader>
                            <v-card-text>
                                <v-slider :min=0 :max=hours.length-1 v-model="skewTime"></v-slider>
                                FC time: {{ skewTimeDisplay }}
                            </v-card-text>
                        </v-card>
                    </v-flex>
                </v-layout>
            </v-container>
        </v-content>

    <v-footer color="indigo" app>
      <span class="white--text">   Markus Sons &copy; 2017</span>
    </v-footer>
    </v-app>
</template>

<script lang="ts">
import Vue from "vue";

import * as Plotly from "plotly.js/lib/core";

export default Vue.extend({
  data(): {
    apiURL: string;
    constants: any;
    firstPlot: boolean;
    layout: Partial<Plotly.Layout>;
    plotData: Plotly.Data[];
    fcData: { temperatures: number[][]; dewPoints: number[][], windU: number[][], windV: number[][] };
    fcLocation: string;
    fcLocations: string[];
    fcLocationCoordinates: any;
    fcModel: string;
    fcModels: string[];
    hours: number[];
    skew: number;
    skewTime: number;
  } {
    return {
      constants: {
        pressureLevels: [
          1000.0,
          950.0,
          925.0,
          900.0,
          850.0,
          800.0,
          700.0,
          600.0,
          500.0,
          400.0,
          300.0,
          200.0,
          150.0,
        ],
      },
      plotData: [],
      fcData: { temperatures: [], dewPoints: [], windU: [], windV: [] },
      fcLocation: "Sammenheim", // 47.412/12.245
      fcLocations: ["Choralpe", "Phoenix", "Sammenheim", "Tauchersreuth"],
      fcLocationCoordinates: {
        Choralpe: "47.419/12.244",
        Phoenix: "33.500/-112.142",
        Sammenheim: "49.049/10.743",
        Tauchersreuth: "49.547/11.210",
      },
      fcModel: "ecmwf",
      fcModels: ["ecmwf", "gfs", "iconEu"],
      hours: [0],
      layout: {
        xaxis: {
          type: "linear",
          range: [-40, 40],
          showline: true,
          zeroline: false,
        },
        yaxis: {
          type: "log",
          range: [Math.log10(1000), Math.log10(200)],
          showline: true,
        },
      },
      skew: 35.0,
      skewTime: 0,
      apiURL: "https://node.windy.com/forecast/meteogram",
      firstPlot: true,
    };
  },

  watch: {
    skewTime() {
      this.plotForecastData();
    },
  },

  computed: {
    skewTimeDisplay(): string {
      if (this.skewTime < this.hours.length) {
        return new Date(this.hours[this.skewTime]).toUTCString();
      } else {
        return "";
      }
    },
  },

  methods: {
    requestForecastData() {
      fetch(
        this.apiURL +
          "/" +
          this.fcModel +
          "/" +
          this.fcLocationCoordinates[this.fcLocation],
      )
        .then((response) => {
          return response.json();
        })
        .then((responseData) => {
          this.processForecastData(responseData);
        });
    },

    estimateThermals() {
      const pls = this.constants.pressureLevels;
      const temps = this.fcData.temperatures.map((temp) => temp[this.skewTime]);
      const shapes: any[] = [];
      const z = [0, 430, 653, 880, 1350, 1840, 2909, 4106, 5477, 7092, 9076, 11700, 13525];

      // look for dynamic instability
      for (let i = 0; i < pls.length - 1; i++) {
          const dTheta = (273.15 + temps[i + 1]) * Math.pow(pls[0] / pls[i + 1], 2 / 7) -
          (273.15 + temps[i]) * Math.pow(pls[0] / pls[i], 2 / 7);

          const rI = 9.81 * dTheta * (z[i + 1] - z[i]) /
           ((273.15 + temps[i]) *
           (Math.pow(this.fcData.windU[i + 1][this.skewTime] - this.fcData.windU[i][this.skewTime], 2)
           + Math.pow(this.fcData.windV[i + 1][this.skewTime] - this.fcData.windV[i][this.skewTime], 2)));

          if (rI < 0.25) {
            const shape = {
              type: "rect",
              xref: "paper",
              yref: "y",
              x0: "0",
              y0: pls[i],
              x1: "1",
              y1: pls[i + 1],
              fillcolor: "grey",
              layer: "below",
              opacity: 0.5,
              line: {
                width: 0,
              },
            };
            shapes.push(shape);
          }
      }

      // look for potentially sinking air
      for (let i = 2; i < pls.length; i++) {
        for (let j = 0; j < i - 1; j++) {
          const a = (temps[j + 1] - temps[j]) / (pls[j + 1] - pls[j]);
          const b = temps[j] - a * pls[j];

          const f = (pressure: number) => {
            return (
              (temps[i] + 273.15) *
                Math.pow(pressure / pls[i], (1.4 - 1.0) / 1.4) -
              273.15 -
              a * pressure -
              b
            );
          };
          const fPrime = (pressure: number) => {
            return (
              (temps[i] + 273.15) *
                (1.4 - 1.0) /
                1.4 /
                pressure *
                Math.pow(pressure / pls[i], (1.4 - 1.0) / 1.4) -
              a
            );
          };

          let p = pls[j];

          for (let k = 0; k < 10; k++) {
            const pNew = p - f(p) / fPrime(p);

            if (isNaN(pNew) || Math.abs(pNew - p) < 0.0001) {
              break;
            }

            p = pNew;
          }

          if (p <= pls[j] && p >= pls[j + 1] && Math.abs(f(p)) < 0.1) {
            const shape = {
              type: "rect",
              xref: "paper",
              yref: "y",
              x0: "0",
              y0: p,
              x1: "1",
              y1: pls[i],
              fillcolor: "orange",
              layer: "below",
              line: {
                width: 0,
              },
            };
            shapes.push(shape);
            break;
          }
        }
      }

      // look for potentially rising air
      // temps[0] = temps[0] + 2; // temperature bonus for heated ground
      for (let i = 0; i < pls.length - 1; i++) {
        for (let j = i + 1; j < pls.length - 1; j++) {
          const a = (temps[j + 1] - temps[j]) / (pls[j + 1] - pls[j]);
          const b = temps[j] - a * pls[j];

          const f = (pressure: number) => {
            return (
              (temps[i] + 273.15) *
                Math.pow(pressure / pls[i], (1.4 - 1.0) / 1.4) -
              273.15 -
              a * pressure -
              b
            );
          };
          const fPrime = (pressure: number) => {
            return (
              (temps[i] + 273.15) *
                (1.4 - 1.0) /
                1.4 /
                pressure *
                Math.pow(pressure / pls[i], (1.4 - 1.0) / 1.4) -
              a
            );
          };

          let p = pls[j];

          for (let k = 0; k < 10; k++) {
            const pNew = p - f(p) / fPrime(p);

            if (isNaN(pNew) || Math.abs(pNew - p) < 0.0001) {
              break;
            }

            p = pNew;
          }

          if (p <= pls[j] && p >= pls[j + 1] && Math.abs(f(p)) < 0.1) {
            const shape = {
              type: "rect",
              xref: "paper",
              yref: "y",
              x0: "0",
              y0: pls[i],
              x1: "1",
              y1: p,
              fillcolor: "yellow",
              layer: "below",
              line: {
                width: 0,
              },
            };
            shapes.push(shape);
            break;
          }
        }
      }

      Plotly.relayout("skew-chart", { shapes });
    },

    processForecastData(r: any) {
      const pls: number[] = this.constants.pressureLevels;

      // reset temperature and dewpoint arrays
      this.fcData.temperatures = [];
      this.fcData.dewPoints = [];
      this.fcData.windU = [];
      this.fcData.windV = [];

      this.hours = r.data.hours;

      // save forecast data
      pls.forEach((pl: number, i: number) => {
        this.fcData.temperatures[i] = [];
        this.fcData.dewPoints[i] = [];
        this.fcData.windU[i] = [];
        this.fcData.windV[i] = [];

        r.data["temp-" + pl.toString() + "h"].forEach(
          (temp: number, j: number) => {
            this.fcData.temperatures[i][j] = temp - 273.15;
          },
        );

        r.data["dewpoint-" + pl.toString() + "h"].forEach(
          (dewPoint: number, j: number) => {
            this.fcData.dewPoints[i][j] = dewPoint - 273.15;
          },
        );

        r.data["wind_u-" + pl.toString() + "h"].forEach(
          (wind: number, j: number) => {
            this.fcData.windU[i][j] = wind;
          },
        );

        r.data["wind_v-" + pl.toString() + "h"].forEach(
          (wind: number, j: number) => {
            this.fcData.windV[i][j] = wind;
          },
        );
      });

      this.plotForecastData();
    },

    plotForecastData() {
      const pls: number[] = this.constants.pressureLevels;

      const traces: Plotly.Data[] = [];
      const xTemperatures: number[] = [];
      const xDewPoints: number[] = [];

      // calculate skew T position
      pls.forEach((pl, i) => {
        xTemperatures.push(
          this.fcData.temperatures[i][this.skewTime] +
            this.skew * Math.log(pls[0] / pl),
        );
      });

      pls.forEach((pl, i) => {
        xDewPoints.push(
          this.fcData.dewPoints[i][this.skewTime] +
            this.skew * Math.log(pls[0] / pl),
        );
      });

      traces.push({
        x: xTemperatures,
        y: pls,
        mode: "lines",
        line: { color: "red" },
        name: "Temperature",
      });
      traces.push({
        x: xDewPoints,
        y: pls,
        mode: "lines",
        line: { color: "blue" },
        name: "Dew Point",
      });

      // delete temp and dew point traces, and re-add
      if (this.firstPlot === false) {
        Plotly.deleteTraces("skew-chart", [-2, -1]);
      }

      this.firstPlot = false;

      Plotly.addTraces("skew-chart", traces);
      Plotly.Plots.resize("skew-chart");

      this.estimateThermals();
    },

    setupSkewT() {
      const pls: number[] = Array.from(
        Array(51),
        (_, x) => 1000 - x * (1000 - 100) / 50,
      );
      const isotherms: number[] = Array.from(Array(40), (_, x) => x * 5 - 100);

      const traces: any[] = [];

      // isotherms
      isotherms.forEach((isotherm: number) => {
        const x: number[] = pls.map((pl: number) => {
          return isotherm + this.skew * Math.log(pls[0] / pl);
        });

        traces.push({
          x,
          y: pls,
          mode: "lines",
          line: { color: "green", width: 0.8 },
          showlegend: false,
        });
      });

      // dry adiabates
      isotherms.forEach((isotherm: number) => {
        const x: number[] = pls.map((pl: number) => {
          return (
            (isotherm + 273.15) * Math.pow(pl / 1000.0, (1.4 - 1.0) / 1.4) -
            273.15 +
            this.skew * Math.log(pls[0] / pl)
          );
        });

        traces.push({
          x,
          y: pls,
          mode: "lines",
          line: { color: "orange", width: 0.8 },
          showlegend: false,
        });
      });

      // moist adiabates
      isotherms.forEach((isotherm: number) => {
        let x: number[] = [];

        x[0] = isotherm;

        for (let i = 1; i < pls.length; i++) {
          const eS =
            0.6113 * Math.exp(17.2694 * x[i - 1] / (x[i - 1] + 273.15 - 35.86));
          // let eS = 0.6113 * Math.exp(5423.0 * (1/273.15 - 1/(273.15+x[i-1])));

          const rS = 0.622 * eS / (pls[i - 1] / 10 - eS);
          const dtdp =
            ((1.4 - 1.0) / 1.4 * (x[i - 1] + 273.15) + 2488.4 * rS) /
            (pls[i - 1] * (1 + 1.35e7 * rS / Math.pow(x[i - 1] + 273.15, 2)));

          x[i] = x[i - 1] + dtdp * (pls[i] - pls[i - 1]);
        }

        x = x.map((xi: number, i: number) => {
          return xi + this.skew * Math.log(pls[0] / pls[i]);
        });

        traces.push({
          x,
          y: pls,
          mode: "lines",
          line: { color: "orange", width: 0.8, dash: "dot" },
          showlegend: false,
        });
      });

      // isohumes
      [0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0].forEach((rS) => {
        const x: number[] = pls.map((pl: number) => {
          return (
            Math.pow(
              1 / 273.15 -
                0.0001844 *
                  Math.log(
                    rS / 1000.0 * pl / 10.0 / (0.6113 * (rS / 1000.0 + 0.622)),
                  ),
              -1,
            ) -
            273.15 +
            this.skew * Math.log(pls[0] / pl)
          );
        });

        traces.push({
          x,
          y: pls,
          mode: "lines",
          line: { color: "blue", width: 0.8, dash: "dot" },
          showlegend: false,
        });
      });

      Plotly.newPlot("skew-chart", traces, this.layout, {
        displayModeBar: false,
      });
    },
  },
  components: {},
  mounted() {
    this.setupSkewT();
    this.requestForecastData();
  },
});
</script>

<style>
.greeting {
  font-size: 20px;
}
</style>