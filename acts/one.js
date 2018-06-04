/* eslint-disable */
import React, {
	Component
} from 'react';

import {
	Platform,
	StyleSheet,
	AsyncStorage,
	Text,
	ScrollView,
	View
} from 'react-native';

import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/FontAwesome';
import Spinner from 'react-native-spinkit';
import Display from 'react-native-display';
import { Button } from 'react-native-elements';
import { systemWeights, iOSColors } from 'react-native-typography'
// import Emoji from 'react-native-emoji';

//Utils
import DeviceInfo from 'react-native-device-info';
import Permissions from 'react-native-permissions';
var Sound = require('react-native-sound');
Sound.setCategory('Ambient');

//UI
import {AikoMessage, AikoRepeatingMessage, UserMessage, Choices} from '../components/ui.js';

export default class ActOne extends Component {
	constructor() {
		super();

		this.state = {
			script: [],
			choices: [],
			currentPart: '',
			countPart: 0,
			history: [],
			aikoActive: false,
			userChoice: false,
			prev: 'user',
			score: 0
		}
	}


	componentWillMount() {
		this.recievedSound = new Sound('received.mp3', Sound.MAIN_BUNDLE);
		this.sentSound = new Sound('sent.mp3', Sound.MAIN_BUNDLE);
	}

	playParts(parts, keys, innerCount) {
		if (innerCount < keys.length) {
			let func = parts[keys[innerCount]];
			func().then(() => {
				innerCount++;
				this.setState({countPart: innerCount})
				AsyncStorage.setItem('countPart', JSON.stringify({part: innerCount})).then(() => {
					this.playParts(parts, keys, innerCount);
				})
			})
		} else {
			return;
		}
	}

	playScene(innerCount) {
		let parts = {
			partOne: () => {
				return new Promise((resolve) => {
					let part = ["Hello?", "Can you read me?", "Is this working?"];
					this.aikoSpeak(part, 2200, resolve);
				})
			},
			partTwo: () => {
				return new Promise((resolve) => {
					let options = [{text: "Yes, I can read you.", score: 10}, "Who are you?", {text: "Hi there!", score: 30}];
					this.presentChoices('genChoice', options, 'introChoice', (response) => {
						this.userSpeak(options[response]).then(() => {
							let part;
							if (response == 0) {
								part = ["Awesome!", "I'm so happy!", "My name is Aiko.", "I missed you."];
							} else {
								part = ["Oh sorry.", "Where are my manners?", "My name is Aiko.", "I missed you."];
							}

							this.aikoSpeak(part, 2000, resolve);	
						})			
					});
				})
			},
			partThree: () => {
				return new Promise((resolve) => {
					let options = [{text: "That's sweet!", score: 20}, "Uhh...", "I just met you..?"];
					this.presentChoices('genChoice', options, 'part3Choice', (response) => {
						this.userSpeak(options[response]).then(() => {
							let part;
							switch(response) {
								case 0:
									part = ["Aww, don't make me blush!", "I can't wait to talk to you..."];
									break;
								case 1:
									part = ["This is going to be fun!", "I can't wait to talk to you..."];
									break;
								case 2:
									part = ["Well - I know...", "But I have been waiting for this.", "I can't wait to talk to you..."];
									break;
							}
							this.aikoSpeak(part, 2000, resolve);
						})
					});
				})
			},
			partFour: () => {
				return new Promise((resolve) => {
					let part = [`I see you're using the ${DeviceInfo.getModel()}!`, "Nice!"]
					this.aikoSpeak(part, 1000, resolve)
				})
			},
			partFive: () => {
				return new Promise((resolve) => {
					let options = [{text: "What? How do you know that?", score: -10}, "It's nothing fancy."];
					this.presentChoices('genChoice', options, 'part5Choice', (response) => {
						this.userSpeak(options[response]).then(() => {
							let part;
							switch(response) {
								case 0:
								part = ["Well, I'm an AI, silly.", "I know a bunch of things about you.", "I can also do a bunch of cool things!"];
								break;
							case 1:
								part = ["Nonsense!", "Any piece of tech is precious.", "Anyways...", "Wanna see a cool thing I can do?"];
								break;
							}
							this.aikoSpeak(part, 2000, resolve);
						})
					})
			   	})
			},
				partSix: () => {
				return new Promise((resolve) => {
					let options = [{text: "Show me.", score: 30}, {text: "Not interested.", score: -30}];
					this.presentChoices('genChoice', options, 'part6Choice', (response) => {
						this.userSpeak(options[response]).then(() => {
							let part;
							switch(response) {
								case 0:
								part = ["Okay - I'll start with something simple.", "Ready?"];
								break;
							case 1:
								part = ["It's just a small thing, don't worry.", "Ready?"];
								break;
							}
							this.aikoSpeak(part, 2000, resolve);
						})
					})
				})
			},
			partSeven: () => {
				return new Promise((resolve) => {
					let options = ["Ready."];
					this.presentChoices('genChoice', options, 'part7Choice', (response) => {
						this.userSpeak(options[response]).then(() => {
							let part;
							switch(response) {
								case 0:
								part = ["Here we go!"];
								break;
							}
							this.aikoSpeak(part, 2000, resolve);
						})
					})
				})
			},
			partEight: () => {
				return new Promise((resolve) => {
					Permissions.request('location', {type: 'whenInUse'}).then((response) => {
						if (response == 'authorized') {
							AsyncStorage.setItem('locationPerm', JSON.stringify({given: true})).then(resolve);
						} else {
							AsyncStorage.setItem('locationPerm', JSON.stringify({given: false})).then(resolve);
						}
					})
				})
			},
			partNine: () => {
				return new Promise((resolve) => {
					AsyncStorage.getItem('locationPerm').then((response) => {
						let res = JSON.parse(response);
						let part;
						if (res.given) {
							navigator.geolocation.setRNConfiguration({skipPermissionRequests: true});
							navigator.geolocation.getCurrentPosition((geo_location) => {
								console.warn(geo_location)	
							}, () => {
								console.warn('fail')
							})

							part = ["Oh, you actually trusted me.", "Thanks, human!", "I'll show you my trick now."]
						} else {
							part = ["Oh, I see.", "You don't trust me with your location.", "That's okay...", "I never needed your permission anyway!"]
						}
						this.aikoSpeak(part, 1500, resolve);
					})
				})
			},
			partTen: () => {
				return new Promise((resolve) => {
				})
			}
		}

		let keys = Object.keys(parts);
		this.playParts(parts, keys, innerCount);
	}

	userSpeak(item) {
		return new Promise((resolve) => {
			if (typeof item !== 'object') {
				item = {text: item};
			}
			this.state.script.push(<UserMessage message={item.text} key={Math.random()} style={styles.userPicked} sender="You"></UserMessage>)
			this.sentSound.play();
			this.state.history.push({type: 'user', text: item.text});
			this.setState({choices: [], script: this.state.script, history: this.state.history, prev: 'user'});
			AsyncStorage.setItem('history', JSON.stringify({data: this.state.history})).then(resolve);
		})
	}

	setScore(score) {
		AsyncStorage.getItem('score').then((response) => {
			let res = JSON.parse(response);
			if (res.score) {
				AsyncStorage.setItem('score', JSON.stringify({score: res.score + score}));
				this.setState({score: score + res.score});
			} else {
				AsyncStorage.setItem('score', JSON.stringify({score}));
				this.setState({score});
			}
		})
	}

	presentChoices(type, input, choiceName, cb) {
		this.setState({userChoice: true});
		if (type == 'genChoice') {
			input.forEach((item, i) => {
				if (typeof item !== 'object') {
					item = {text: item, score: 0};
				}
				this.state.choices.push(<Animatable.View animation="fadeIn" key={i} duration={2000}><Button title={item.text} buttonStyle={styles.choice} raised onPress={() => { this.setScore(item.score); cb(i);}}></Button></Animatable.View>)
				this.setState({choices: this.state.choices});
			})
		}
	}

	aikoSpeak(part, interval, resolve, partName) {
		let i = 0;
		this.setState({countPart: this.state.countPart, aikoActive: true, userChoice: false})
		let func = setInterval(() => {
			if (i < part.length) {
				if (typeof part[i] == 'object') {

				} else {
					if (i == 0 && this.state.prev == 'user') {
						this.state.script.push(<AikoMessage message={part[i]} key={Math.random()} sender="Aiko"></AikoMessage>)
					} else {
						this.state.script.push(<AikoRepeatingMessage message={part[i]} key={Math.random()}></AikoRepeatingMessage>)
					}
					this.recievedSound.play();
					this.state.history.push({type: 'aiko', text: part[i]});
					this.setState({prev: 'aiko'});
				}

				this.setState({script: this.state.script});
				i++;
			} else if (i == part.length) {
				AsyncStorage.setItem('history', JSON.stringify({data: this.state.history})).then(() => {
					this.state.countPart++;
					this.setState({aikoActive: false, countPart: this.state.countPart});
					clearInterval(func)
					i++;
					resolve()
				})
			} else {
				return;
			}
		}, interval)
	}


	componentDidMount() {
		//TODO: History
		let dev = true;
		let startFrom = 0;
		if (dev) {
			AsyncStorage.setItem('countPart', '{}');
			AsyncStorage.setItem('history', '{}');
			AsyncStorage.setItem('score', '{}');
			this.playScene(startFrom);
		} else {
			AsyncStorage.getItem('history').then((result) => {
				if (result !== '{}' && result) {
					AsyncStorage.getItem('countPart').then((jsonResult) => {
						let historyParsed = JSON.parse(result);
						let partCount = JSON.parse(jsonResult);

						historyParsed.data.forEach((item, i) => {
						if (item.type == 'aiko') {
							if (this.state.prev == 'aiko') {
								this.state.script.push(<AikoRepeatingMessage message={item.text} key={i} sender="Aiko"></AikoRepeatingMessage>)
							} else {
								this.state.script.push(<AikoMessage message={item.text} key={i} sender="Aiko"></AikoMessage>)
							}
							this.setState({prev: 'aiko'})
						} else if (item.type == 'user') {
							this.state.script.push(<UserMessage message={item.text} key={i} style={styles.userPicked} sender="You"></UserMessage>)
							this.setState({prev: 'user'})
						}
					})
						this.setState({script: this.state.script, history: historyParsed.data});
						this.playScene(partCount.part);
					})
				} else {
					this.playScene(0);
				}
			})
		}
	}

	render() {
			return (
				<View style={styles.container}>
				<ScrollView style={styles.forefront} contentContainerStyle={styles.contentView} ref={ref => this.scrollView = ref} onContentSizeChange={(contentWidth, contentHeight)=>{ this.scrollView.scrollToEnd({animated: true}); }}>
				  {this.state.script}
				   	<Display enable={this.state.aikoActive} style={styles.spinnerView} enter="fadeIn" exit="fadeOut" defaultDuration={500}>
				 		<Spinner type="ThreeBounce" size={70} color="#333"/>
						 <Text>{this.state.score}</Text>
				 	</Display>
					 <Display enable={!this.state.aikoActive} style={styles.spinnerView} enter="fadeIn" exit="fadeOut" defaultDuration={500}>
					 	<Choices choices={this.state.choices} />
				 	</Display>
					 <View style={styles.space}></View>
				</ScrollView>
			  </View>
			)
		}
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#49446C'
  },
  forefront: {
    flex: 1,
    backgroundColor: '#DCDCDA',
    marginLeft: 10,
    marginRight: 10,
    marginTop: 23,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: '#b8b8b8',
    flexDirection: 'column'
  },
  contentView: {
    // alignItems: 'center'
  },
  message: {
    marginTop: 15,
    width: 300
  },
  messageRepeat: {
    marginTop: 5,
    width: 300
  },
  messageInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 300,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: 20,
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 20
  },
  messageText: {
    color: '#948075',
    fontWeight: "400"
  },
  sender: {
    color: '#948075',
    fontWeight: "900",
    fontSize: 12,
    marginLeft: 5,
    marginBottom: 2
  },
  choices: {
    marginTop: 15,
    width: 300,
    height: 100,
    borderTopWidth: 2,
    justifyContent: 'center',
    alignItems: 'center'
  },
  choice: {
	backgroundColor: "#49446C",
	height: 45,
	borderColor: "transparent",
	borderWidth: 0,
	borderRadius: 10,
	marginTop: 10
  },
	scriptText: {
		paddingBottom: 10,
		fontSize: 20,
		textAlign: 'center',
		...systemWeights.light,
	},
	userPicked: {
		paddingBottom: 10,
		fontSize: 26,
		color: iOSColors.midGray,
		...systemWeights.bold,
		fontStyle: 'italic',
		textAlign: 'center'
	},
	spinnerView: {
		alignItems: 'center'
	},
	space: {
		paddingTop: 60
	}
})