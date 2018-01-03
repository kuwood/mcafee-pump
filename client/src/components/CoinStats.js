import React, { Component } from 'react';
import { Statistic } from 'semantic-ui-react';
class CoinStats extends Component {
  constructor(props) {
    super(props);
    this.state = {
      afterColor: 'black',
      currentColor: 'black'
    };
  }

  componentWillReceiveProps(nextProps) {
    this.determineColor(nextProps.before, nextProps.after, 'afterColor');
    this.determineColor(nextProps.before, nextProps.current, 'currentColor');
  }

  determineColor = (before, after, key) => {
    if (before > after) {
      this.setState({[key]: 'red'})
    } else if (before === after) {
      this.setState({[key]: 'black'})
    } else {
      this.setState({[key]: 'green'})
    }
  }

  calcPercentageChange(before, after) {
    return ((after - before) / before) * 100 
  }

  render() {
    return (
      <div style={{width: '290px', padding: '0 16px', margin: '0 auto'}}>
        <Statistic.Group size='tiny' widths={3}>
          <Statistic >
            <Statistic.Value>{this.props.before}</Statistic.Value>
            <Statistic.Label>one hour before</Statistic.Label>
          </Statistic>
          <Statistic color={this.state.afterColor}>
            <Statistic.Value>({this.calcPercentageChange(+parseFloat(this.props.before), +parseFloat(this.props.after)).toFixed(2)}%)</Statistic.Value>
            <Statistic.Value>{this.props.after}</Statistic.Value>
            <Statistic.Label>one hour after</Statistic.Label>
          </Statistic>
          <Statistic color={this.state.currentColor}>
            <Statistic.Value>({this.calcPercentageChange(+parseFloat(this.props.before), +parseFloat(this.props.current)).toFixed(2)}%)</Statistic.Value>
            <Statistic.Value>{this.props.current}</Statistic.Value>
            <Statistic.Label>current price</Statistic.Label>
          </Statistic>
        </Statistic.Group>
      </div>
    )
  }  
};

export default CoinStats;
