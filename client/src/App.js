import React, { Component } from 'react';
import logo from './logo.png';
import {
  Container, Grid, Header, Image, Menu, Segment, Visibility
} from 'semantic-ui-react';

import TweetCard from './components/TweetCard';
import CoinStats from './components/CoinStats';
import { setInterval } from 'timers';

const menuStyle = {
  border: 'none',
  borderRadius: 0,
  boxShadow: 'none',
  marginBottom: '1em',
  transition: 'box-shadow 0.5s ease, padding 0.5s ease',
};

const fixedMenuStyle = {
  boxShadow: '0px 3px 5px rgba(0, 0, 0, 0.2)',
};

const FixedMenu = () => (
  <Menu
    borderless
    fixed='top'
    style={fixedMenuStyle}
  >
    <Container >
      <Menu.Item>
        <Image size='mini' src={logo} />
      </Menu.Item>
      <Menu.Item header>The McAfee Pump</Menu.Item>
      <Menu.Item as='a'>About</Menu.Item>
    </Container>
  </Menu>
);

class App extends Component {

  constructor() {
    super();
    this.state = {
      menuFixed: false,
      cot: {
        name: '',
        currency_proximity: {
          before: {},
          after: {},
          current: '',
          symbol: ''
        },
        screenName: '',
        fullText: '',
        profileImage: ''
      }
    };
  }

  stickTopMenu = () => this.setState({ menuFixed: true })

  unStickTopMenu = () => this.setState({ menuFixed: false })

  // make request to get cot
  componentDidMount() {
    fetch('/cot')
      .then(res => res.json())
      .then(data => {
        const cot = JSON.parse(data);
        const newcot = {
          name: cot.user.name,
          currency_proximity: cot.currency_proximity,
          screenName: cot.user.screen_name,
          fullText: cot.full_text,
          media: cot.entities.media || '',
          profileImage: cot.user.profile_image_url_https,
          createdAt: cot.created_at
        }
        this.setState({cot: newcot});
      })
      .catch(e => console.log(e));
      this.currentPriceTick();
    const priceInterval = setInterval(this.currentPriceTick, 5000);
    this.setState({priceInterval});
  }

  componentWillUnmount() {
    clearInterval(this.state.priceInterval);
  }

  currentPriceTick = () => {
    if (this.state.cot.currency_proximity.symbol) {
      const {symbol} = this.state.cot.currency_proximity; 
      fetch(`/coin/${symbol}/current`)
        .then(res => res.json())
        .then(data => {
          const current = JSON.parse(data).BTC + '';
          const newCot = {...this.state.cot}
          newCot.currency_proximity.current = current.includes('e-') ?
            this.covertToFloat(current) :
            current;
          this.setState({cot: newCot})
        })
    }
  }

  covertToFloat(str) {
    const split = str.split('e-');
    let suffix = split[0].split('.').join('');
    if (suffix.length === 1) {
      suffix += '0'
    };
    const prefix = '0.' + '0'.repeat(parseInt(split[1] - 1, 10));
    return prefix + suffix;
  }

  render() {
    const { menuFixed, cot } = this.state
    return (
      <div className="App">
        { menuFixed && <FixedMenu /> }
        <Visibility
          onBottomPassed={this.stickTopMenu}
          onBottomVisible={this.unStickTopMenu}
          once={false}
        >
          <Menu
            borderless
            style={menuStyle}
          >
            <Container >
              <Menu.Item>
                <Image size='mini' src={logo} />
              </Menu.Item>
              <Menu.Item header>The McAfee Pump</Menu.Item>
              <Menu.Item as='a'>About</Menu.Item>
            </Container>
          </Menu>

        <Container text>
          <Grid stackable columns={2}>
            <Grid.Column width={16}>
              <Header textAlign='center' style={{padding: '1em 0'}}>
                <Header.Content>Coin of the week: <span style={{color: '#2185d0'}}>{cot.currency_proximity.name} ({cot.currency_proximity.symbol})</span></Header.Content>
              </Header>
            </Grid.Column>
            <Grid.Column width={8}>
              <TweetCard centered twitterImage={cot.profileImage} twitterName={cot.name} twitterSymbol={cot.screenName} tweetText={cot.fullText} media={cot.media} />
            </Grid.Column>
            <Grid.Column width={8}>
              <CoinStats
                before={cot.currency_proximity.before.price}
                after={cot.currency_proximity.after.price}
                current={cot.currency_proximity.current}
              />
            </Grid.Column>
          </Grid>
        </Container>
        </Visibility>
        <Segment vertical inverted style={{marginTop: '4em', textAlign: 'center'}} >
          <a style={{color: 'white'}}target='blank_' href='https://github.com/kuwood'>GitHub</a>
        </Segment>
      </div>
    );
  }
}

export default App;
