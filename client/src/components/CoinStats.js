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
    const beforeFloat = +parseFloat(before)
    const afterFloat = +parseFloat(after)
    const percentageChange = (((afterFloat - beforeFloat) / beforeFloat) * 100).toFixed(2) 
    return percentageChange
  }

  render() {
    return ( this.props.current ? 
      <div style={{width: '290px', padding: '0 16px', margin: '0 auto'}}>
        <Statistic.Group size='tiny' widths={3}>
          <Statistic >
            <Statistic.Value>{this.props.before}</Statistic.Value>
            <Statistic.Label>one hour before</Statistic.Label>
          </Statistic>
          <Statistic color={this.state.afterColor}>
            <Statistic.Value>({this.calcPercentageChange(this.props.before, this.props.after)}%)</Statistic.Value>
            <Statistic.Value>{this.props.after}</Statistic.Value>
            <Statistic.Label>one hour after</Statistic.Label>
          </Statistic>
          <Statistic color={this.state.currentColor}>
            <Statistic.Value>({this.calcPercentageChange(this.props.before, this.props.current)}%)</Statistic.Value>
            <Statistic.Value>{this.props.current}</Statistic.Value>
            <Statistic.Label>current price</Statistic.Label>
          </Statistic>
        </Statistic.Group>
      </div> :
      'Loading Coin Stats...'
    )
  }  
};

export default CoinStats;
