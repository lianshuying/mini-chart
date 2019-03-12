import F2 from '@antv/my-f2';
import methods from '../mixins/methods';
import util from '../util';

Component({
  mixins: [methods],
  props: {
    categories: [],
    series: [],
    xAxis: {
      tickCount: 3,
    },
    yAxis: {
      tickCount: 3,
    },
    tooltip: false,
    legend: false,
  },
  didMount() {
    my.call('getStartupParams', {}, (result) => {
      util.tracert('line', result.appId, result.url);
    });

    const id = `am-mc-line-${this.$id}`;
    const ctx = my.createCanvasContext(id);
    const canvas = this.canvas = new F2.Renderer(ctx);

    const pixelRatio = my.getSystemInfoSync().pixelRatio;
    ctx.scale(pixelRatio, pixelRatio);

    my.createSelectorQuery()
      .select(`#${id}`)
      .boundingClientRect()
      .exec(res => {
        if(!res || !res.length) {
          return;
        }
        const { width, height } = res[0];
        this.setData({
          width: width * pixelRatio,
          height: height * pixelRatio,
        });
        const { padding, appendPadding } = this.props;

        this.chart = new F2.Chart({
          el: canvas,
          width,
          height,
          padding,
          appendPadding,
        });
      });
  },
  didUpdate() {
    const { categories, series, xAxis, yAxis, tooltip, legend } = this.props;

    const chart = this.chart;
    chart.clear();

    let data = [];
    if(series.length === 1) {
      data = series[0].data.map((item, i) => {
        return {
          key: categories[i],
          value: item,
        }
      });
    }
    else if(series.length > 1) {
      series.forEach(kind => {
        data = data.concat(kind.data.map((item, i) => {
          return {
            key: categories[i],
            value: item,
            type: kind.type,
          };
        }));
      });
    }
    chart.source(data);

    if(xAxis) {
      xAxis.label = util.label;
      chart.scale('key', util.scale(xAxis));
      chart.axis('key', util.axis(xAxis));
    }
    if(yAxis) {
      chart.scale('value', util.scale(yAxis));
      chart.axis('value', util.axis(yAxis));
    }
    chart.tooltip(tooltip);
    chart.legend(legend);

    const style = {};
    series.forEach(kind => {
      style[kind.type] = kind.style;
    });
    const color = {};
    series.forEach(kind => {
      color[kind.type] = kind.color;
    });

    if(series.length === 1) {
      chart.line().position('key*value').color('type', type => {
        return color[type];
      }).shape('type', type => {
        return style[type] || 'line';
      });
      if(series[0].point) {
        chart.point().position('key*value').style(series[0].point);
      }
    }
    else if(series.length > 1) {
      chart.line().position('key*value').color('type', type => {
        return color[type];
      }).shape('type', type => {
        return style[type] || 'line';
      });
      let pointType = [];
      let pointStyle;
      series.forEach(kind => {
        if(kind.point) {
          pointType.push(kind.type);
          pointStyle = kind.point;
        }
      });
      if(pointType.length) {
        chart.point().position('key*value').color('type', type => {
          return color[type];
        }).size('type', v => {
          if(pointType.indexOf(v) === -1) {
            return 0;
          }
        }).style(pointStyle);
      }
    }

    chart.render();
  },
});
