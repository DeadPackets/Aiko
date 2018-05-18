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
import TypeWriter from 'react-native-typewriter'
import Display from 'react-native-display';
import { Button } from 'react-native-elements';
import { systemWeights, iOSColors } from 'react-native-typography'
// import Emoji from 'react-native-emoji';

//Utils
import DeviceInfo from 'react-native-device-info';

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
			userChoice: false
		}
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
					let options = ["Yes, I can read you.", "Who are you?"];
					this.presentChoices('genChoice', options, 'introChoice', (response) => {
						this.userSpeak(options[response]).then(() => {
							let part;
							if (response == 0) {
								part = ["Awesome!", "I'm so happy!", "My name is Aiko.", "I missed you!"];
							} else {
								part = ["Oh sorry!", "Where are my manners?", "My name is Aiko.", "I missed you!"];
							}

							this.aikoSpeak(part, 2000, resolve);	
						})			
					});
				})
			},
			partThree: () => {
				return new Promise((resolve) => {
					let options = ["I missed you too!", "Uhh...", "I just met you..?"];
					this.presentChoices('genChoice', options, 'part3Choice', (response) => {
						this.userSpeak(options[response]).then(() => {
							let part;
							switch(response) {
								case 0:
									part = ["Aww, don't make me blush!", "I can't wait to talk to you!"];
									break;
								case 1:
									part = ["This is going to be fun!", "I can't wait to talk to you!"];
									break;
								case 2:
									part = ["Well - I know...", "But I have been waiting for this!", "I can't wait to talk to you!"];
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
					let options = ["How do you know that?", "It's nothing fancy."];
					this.presentChoices('genChoice', options, 'part5Choice', (response) => {
						this.userSpeak(options[response]).then(() => {
							let part;
							switch(response) {
								case 0:
								part = ["Well, I'm an AI, silly!", "I know a bunch of things about you!", "I can also do a bunch of cool things!"];
								break;
							case 1:
								part = ["Nonsense!", "Any piece of tech is precious!", "Anyways...", "Wanna see a bunch of cool things I can do?"];
								break;
							}
							this.aikoSpeak(part, 2000, resolve);
						})
					})
				})
			}
		}

		let keys = Object.keys(parts);
		this.playParts(parts, keys, innerCount);
	}

	userSpeak(text) {
		return new Promise((resolve) => {
			this.state.script.push(<Text key={Math.random()} style={styles.userPicked}>{text}</Text>)
			this.state.history.push({type: 'user', text: text});
			this.setState({choices: [], script: this.state.script, history: this.state.history});
			AsyncStorage.setItem('history', JSON.stringify({data: this.state.history})).then(resolve);
		})
	}

	presentChoices(type, input, choiceName, cb) {
		this.setState({userChoice: true});
		if (type == 'genChoice') {
			input.forEach((item, i) => {
				this.state.choices.push(<Button title={item} key={i} style={styles.choicesContainer} buttonStyle={styles.choicesButton} onPress={() => { cb(i);}}></Button>)
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
					this.state.script.push(<Animatable.Text animation="fadeIn"  key={Math.random()} duration={1000} style={styles.scriptText}>{part[i]}</Animatable.Text>)
					this.state.history.push({type: 'aiko', text: part[i]});
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
			this.playScene(startFrom);
		} else {
			AsyncStorage.getItem('history').then((result) => {

				if (result !== '{}' && result) {
					AsyncStorage.getItem('countPart').then((jsonResult) => {
						let historyParsed = JSON.parse(result);
						let partCount = JSON.parse(jsonResult);

						historyParsed.data.forEach((item, i) => {
						if (item.type == 'aiko') {
							this.state.script.push(<Text key={i} style={styles.scriptText}>{item.text}</Text>)
						} else if (item.type == 'user') {
							this.state.script.push(<Text key={i} style={styles.userPicked}>{item.text}</Text>)
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
				<ScrollView style={styles.mainContainer} contentContainerStyle={styles.childContainer}>
					<View style={styles.childContainer}>
						{this.state.script}
						<View style={styles.choicesView}>
							{this.state.choices}
						</View>
						<Display enable={this.state.aikoActive} style={styles.spinnerView} enter="fadeIn" exit="fadeOut" defaultDuration={500}>
							<Spinner type="ThreeBounce" size={70} color="#333"/>
						</Display>
					</View>
				</ScrollView>
			)
		}
}

const styles = StyleSheet.create({
	container: {
	  flex: 1,
	  alignItems: 'center'
	},
	mainContainer: {
		top: 50
	},
	childContainer: {
		alignItems: 'center'
	},
	mainTitle: {
	  fontSize: 64
	},
	scriptText: {
		paddingBottom: 10,
		fontSize: 20,
		textAlign: 'center',
		...systemWeights.light,
	},
	choicesView: {
		flexDirection: 'column'
	},
	choicesContainer: {
		padding: 10
	},
	choicesButton: {
		backgroundColor: '#446CB3'
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
	}
})