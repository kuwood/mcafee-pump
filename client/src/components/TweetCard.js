import React from 'react';
import { Card, Image } from 'semantic-ui-react';
const TweetCard = (props) => (
  <Card centered={props.centered}>
    <Card.Content>
      <Image floated='right' size='mini' src={props.twitterImage} />
      <Card.Header>
          {props.twitterName}
      </Card.Header>
      <Card.Meta>
          @{props.twitterSymbol}
      </Card.Meta>
      <Card.Description>
          {props.tweetText &&
            props.tweetText.toLowerCase().split('coin of the week')[1].split(' ')[1].substr(0,5) === 'https' ?
            <img style={{maxWidth: '100%'}} src={props.media[0].media_url_https} alt='tweet' /> :
            props.tweetText
          }
      </Card.Description>
    </Card.Content>
  </Card>
);

export default TweetCard;
