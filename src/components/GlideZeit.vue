<template>
    <v-app>
        <v-toolbar color="indigo" dark fixed app>
            <v-toolbar-side-icon></v-toolbar-side-icon>
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
                            
                            <v-card-text>
                                <div>
                                    <v-text-field  label="fcLocation" v-model="fcLocation"/>
                                    <v-select label="Model" v-model="fcModel" :items="fcModels"/>
                                </div>
                            </v-card-text>

                            <v-btn @click="requestForecastData">Get FC</v-btn>

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
import SkewT from "./SkewT.vue";
import Controls from "./Controls.vue";
import * as Plotly from "plotly.js";

export default Vue.extend({
    data() : {constants: any, layout: Partial<Plotly.Layout>, plotData: Plotly.Data[], fcData: any, fcLocation: string, fcModel: string, fcModels: string[], skew: number, apiURL: string} {
        return {
            constants: {
                pressureLevels: [1000.0, 950.0, 925.0, 900.0, 850.0, 800.0, 700.0, 600.0, 500.0, 400.0, 300.0, 200.0, 150.0]
            },
            plotData: [],
            fcData: {temperatures: [], dewPoints: []},
            fcLocation: "47.412/12.245",
            fcModel: "ecmwf",
            fcModels: ["ecmwf", "gfs"],
            layout: {
                xaxis: {
                    type: "linear",
                    range: [-50, 40],
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
            apiURL: "https://node.windy.com/forecast/meteogram",
        }  
    },
    methods: {
        requestForecastData: function() {
            fetch(this.apiURL + "/" + this.fcModel + "/" + this.fcLocation).then( (response) => {
                return response.json();
            }).then( (responseData) => {
                this.processForecastData(responseData);
            });
        },

        processForecastData: function(r : any) {

            const pls : number[] = this.constants.pressureLevels;

            let traces : Plotly.Data[] = [];
            let temperatures: number[] = [];
            let dewPoints: number[] = [];

            // save forecast data
            pls.forEach((pl: number, i: number) => {
                this.fcData.temperatures[i] = r.data["temp-" + pl.toString() + "h"][0] - 273.15;
                this.fcData.dewPoints[i] = r.data["dewpoint-" + pl.toString() + "h"][0] - 273.15;
            });

            // calculate skew T position
            pls.forEach((pl, i) => {
                temperatures.push(this.fcData.temperatures[i] + this.skew * Math.log(pls[0] / pl));
            });

            pls.forEach((pl, i) => {
                dewPoints.push(this.fcData.dewPoints[i] + this.skew * Math.log(pls[0] / pl));
            });

            traces.push({ x: temperatures, y: pls, mode: "lines", line: { color: "red" }, name: "Temperature"});
            traces.push({ x: dewPoints, y: pls, mode: "lines", line: { color: "blue" }, name: "Dew Point"});

            // delete temp and dew point traces, and re-add
            //Plotly.deleteTraces("skew-chart", [-2, -1]);
            Plotly.addTraces("skew-chart", traces);
            Plotly.Plots.resize("skew-chart");
        },

        setupSkewT: function() {

            const pls : number[] = this.constants.pressureLevels;
            const isotherms = [-100, -80, -60, -40, -20, 0, 20, 40, 60];

            let isothermTraces: any[] = [];
            
            isotherms.forEach((isotherm: number) => {

                let x : number[] = [];

                pls.forEach((pl: number, i: number) => {
                    x.push(isotherm + this.skew * Math.log(pls[0] / pl));
                });
                
                isothermTraces.push({x: x, y: pls, mode: "lines", line: { color: "green"}, showlegend: false});
            });

            Plotly.plot("skew-chart", isothermTraces, this.layout, {displayModeBar: false});
        }
    },
    components: { SkewT, Controls },
    computed: {
    },
    created: function() {
    },
    mounted: function() {
        this.setupSkewT();
    },
});
</script>

<style>
.greeting {
    font-size: 20px;
}
</style>