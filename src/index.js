import _ from 'lodash';
import Highcharts from 'highcharts';
import './style.css';
import RefreshIcon from './refresh-icon.png';

const Self = {
    init: function() {
        const element = document.createElement('div');
        element.innerHTML = '<div class="header-container">관광산업 매출액 현황 <img id="refresh" class="refresh"></img><span id="timer" class="timer"></span> <hr></div>';
        element.innerHTML += '<div class="container"><b>년도<b/><select id="select" class="select"></select> <div id="column_chart"></div></div>';
        element.innerHTML += '<div class="container display-flex"><div class="table-container"><div id="table"></div><div id="paging" class="paging text-center"></div></div> <div class="pie-chart-container"><div id="pie_chart"></div></div> </div>';
        document.body.appendChild(element);

        this.eventlistener();
    },

    eventlistener: function() {
        this.timer();
        this.pagination();
        this.data('all', 1);
        this.data('limit', 1);
    },

    timer: function() {
        const element = document.getElementById('timer');
        let second = 30;
        const interval = setInterval(function() {
            if (second == 0) {
                Self.eventlistener();
                clearInterval(interval);
            }
            element.innerHTML = second-- + '초 후 갱신';
        }, 1000);

        const refresh = document.getElementById('refresh');
        refresh.src = RefreshIcon;
        refresh.addEventListener('click', function() {
            clearInterval(interval);
            Self.eventlistener();
        });
    },

    pagination: function() {
        const serviceKey = 'h%2BA2NZbYZynxPvI1aEUBVqmZhf6ILbn4W74Mc7tQ6ZBLoMZGno%2BKmHwbRJu8NTW1sApd%2F0%2FXqMM1yBg0hFKbWQ%3D%3D';
        const url = 'http://openapi.tour.go.kr/openapi/service/TourismIndustStatsService/getTourismBsnesTrendIndexList?ID_CD=B&T_CD=PRESENT&serviceKey='+serviceKey;
        
        fetch('https://api.allorigins.win/raw?url='+encodeURIComponent(url))
            .then(response => response.text())
            .then((data) => {
                const xmlNode = new DOMParser().parseFromString(data, 'text/xml');
                const totalCnt = xmlNode.getElementsByTagName('totalCount')[0].textContent;
                const pageCnt = Math.ceil(totalCnt/10);
                let html = '';
                for (let i=1; i<=pageCnt; i++) {
                    html += '<div>' + i + '</div>';
                }
                const element = document.getElementById('paging');
                element.innerHTML = html;

                element.children[0].className = 'active';
                for (const paging of element.children) {
                    paging.addEventListener('click', function() {
                        for (let i=0; i<pageCnt; i++) {
                            element.children[i].classList.remove('active');
                        }
                        paging.className = 'active';
                        Self.data('limit', paging.textContent);
                    });
                }
            });
    },

    data: function(type, pageNo) {
        const serviceKey = 'h%2BA2NZbYZynxPvI1aEUBVqmZhf6ILbn4W74Mc7tQ6ZBLoMZGno%2BKmHwbRJu8NTW1sApd%2F0%2FXqMM1yBg0hFKbWQ%3D%3D';
        const numOfRows = type=='all' ? 100 : 10;
        const url = 'http://openapi.tour.go.kr/openapi/service/TourismIndustStatsService/getTourismBsnesTrendIndexList?ID_CD=B&T_CD=PRESENT&serviceKey='+serviceKey+'&numOfRows='+numOfRows+'&pageNo='+pageNo;
        
        fetch('https://api.allorigins.win/raw?url='+encodeURIComponent(url))
            .then(response => response.text())
            .then((data) => {
                const xmlNode = new DOMParser().parseFromString(data, 'text/xml');
                const items = xmlNode.getElementsByTagName('item');
                let result = [];
                for (const item of items) {
                    let itemArr = {};
                    for (const children of item.children) {
                        itemArr[children.tagName] = children.textContent;
                    }
                    result.push(itemArr);
                }
                
                if (type == 'all') {
                    Self.columnChartSelect(result);
                } else if (type == 'limit') {
                    Self.table(result);
                    Self.pieChart(result[0]);
                    const element = document.getElementById('table').getElementsByClassName('btn');
                    element[0].className += ' active';
                    for (const btn of element) {
                        btn.addEventListener('click', function(e) {
                            for (let i=0; i<element.length; i++) {
                                element[i].classList.remove('active');
                            }
                            btn.className += ' active';
    
                            const yq = e.target.id.split('_')[1];
                            const data = result.filter(
                                e => e.yq == yq
                            )[0];
                            Self.pieChart(data);
                        });
                    }
                }
            });
    },

    table: function(data) {
        const thead = '<thead><tr><th>분기</th><th class="text-right">유원시설업</th><th class="text-right">카지노업</th><th class="text-right">휴양업</th><th></th></tr></thead>';
        let tbody = '<tbody>';
        data.forEach(element => {
            tbody += '<tr>';
            tbody += '<td class="text-center">' + element.yq.substr(0,4) + '년 ' + element.yq.substr(4,1) + '분기</td>';
            tbody += '<td class="text-right">' + element.amue + '</td>';
            tbody += '<td class="text-right">' + element.casino + '</td>';
            tbody += '<td class="text-right">' + element.recreation + '</td>';
            tbody += '<td class="text-center"><button id="btn_' + element.yq + '" class="btn" type="button">통계보기</button></td>';
            tbody += '</tr>';
        });
        tbody += '</tbody>';

        const element = document.getElementById('table');
        element.innerHTML = '<table border="1">' + thead + tbody + '</table>';
    },

    pieChart: function(data) {
        Highcharts.chart('pie_chart', {
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type: 'pie'
            },
            title: {
                text: data.yq.substr(0,4) + '년<br>' + data.yq.substr(4,1) + '분기',
                verticalAlign: 'middle',
                y: 38
            },
            credits: {
                enabled: false
            },
            exporting: {
                enabled: false
            },
            legend: {
                verticalAlign: 'top'
            },
            accessibility: {
                point: {
                    valueSuffix: '%'
                }
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    colors: ['#efeade','#c3e2dd','#6eceda'],
                    dataLabels: {
                        enabled: true,
                        format: '{point.percentage:.1f}%',
                        distance: -50
                    },
                    showInLegend: true
                }
            },
            series: [{
                name: '매출액',
                colorByPoint: true,
                innerSize: '50%',
                data: [{
                    name: '유원시설업',
                    y: Number(data.amue)
                }, {
                    name: '카지노업',
                    y: Number(data.casino)
                },  {
                    name: '휴양업',
                    y: Number(data.recreation)
                }]
            }]
        });
    },

    columnChartSelect: function(data) {
        const years = data.map(function (d, i) {
            return d['yq'].substr(0,4);
        }).filter(function (d, i, arr) {
            return arr.indexOf(d.substr(0,4)) == i;
        }).sort();

        const element = document.getElementById('select');
        let option = '';
        years.forEach(element => {
            option += '<option>' + element + '</option>';
        });
        element.innerHTML = option;

        let year = element.options[0].text;
        Self.columnChart(year, data);
        element.addEventListener('change', function(e) {
            year = element.options[element.selectedIndex].text;
            Self.columnChart(year, data);
        });
    },

    columnChart: function(year, data) {
        const chartData = data.filter(
            e => e.yq.substr(0,4) == year
        ).sort((a, b) => a.yq - b.yq);

        let q = [], amue = [], casino = [], recreation = [];
        chartData.forEach(element => {
            q.push(element.yq.substr(4,1) + '분기');
            amue.push(Number(element.amue));
            casino.push(Number(element.casino));
            recreation.push(Number(element.recreation));
        });

        Highcharts.chart('column_chart', {
            chart: {
                type: 'column',
                height: 300
            },
            title: {
                text: ''
            },
            credits: {
                enabled: false
            },
            exporting: {
                enabled: false
            },
            legend: {
                verticalAlign: 'top'
            },
            xAxis: {
                categories: q,
                crosshair: true
            },
            yAxis: {
                min: 0,
                title: {
                    text: '매출액'
                }
            },
            tooltip: {
                shared: true
            },
            plotOptions: {
                column: {
                    dataLabels: {
                        enabled: true,
                        inside: true
                    }
                }
            },
            series: [{
                name: '유원시설업',
                data: amue,
                color: '#c5dad1'
            }, {
                name: '카지노업',
                data: casino,
                color: '#c9cbe0'
            }, {
                name: '휴양업',
                data: recreation,
                color: '#eeb8b8'
            }]
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    Self.init();
});