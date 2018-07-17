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
	PushNotificationIOS,
	AppState,
	CameraRoll,
	Image,
	FlatList,
	NetInfo,
	View
} from 'react-native';

//Config
import config from '../config';

//UI
import {AikoMessage, AikoRepeatingMessage, AikoDeletedMessage, UserMessage, AikoImage, Choices} from '../components/ui.js';

//Components
import * as Animatable from 'react-native-animatable';
// import Icon from 'react-native-vector-icons/FontAwesome';
import Spinner from 'react-native-spinkit';
import Display from 'react-native-display';
import { Button } from 'react-native-elements';
import { systemWeights, iOSColors } from 'react-native-typography'

//Utils
import DeviceInfo from 'react-native-device-info';
// import { NetworkInfo } from 'react-native-network-info';
import Permissions from 'react-native-permissions';
import Geocoder from 'react-native-geocoder'
import PushNotification from 'react-native-push-notification';
import Sound from 'react-native-sound';
import RNFetchBlob from 'rn-fetch-blob'

//Init stuff
PushNotification.configure({
	onNotification: function(notification) {
		notification.finish(PushNotificationIOS.FetchResult.NoData);
	}
});

Sound.setCategory('Ambient');

export default class ActOne extends Component {
	constructor() {
		super();

		this.state = {
			script: [],
			choices: [],
			currentPart: '',
			countPart: 0,
			maxItems: 50,
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
			func(this.state.pathIdentifier).then((pathIdentifier) => {
				innerCount++;
				this.setState({countPart: innerCount, pathIdentifier})
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
							if (response === 0) {
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
					let part = [`You're using the ${DeviceInfo.getModel()} made by ${DeviceInfo.getBrand()}!`, `Running on ${Platform.OS === 'ios' ? "iOS" : "Android"} version ${DeviceInfo.getSystemVersion()}.`, `And you called it "${DeviceInfo.getDeviceName()}".`, "Nice!"]
					this.aikoSpeak(part, 2000, resolve)
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
						if (response === 'authorized') {
							this.storeValue('locationPerm', true).then(resolve);
							this.setTrust(100);
						} else {
							this.storeValue('locationPerm', false).then(resolve);
							this.setTrust(-50);
						}
					})
				})
			},
			partNine: () => {
				return new Promise((resolve) => {
					AsyncStorage.getItem('locationPerm').then((response) => {
						let res = JSON.parse(response);
						let part;
						if (res.value) {
							navigator.geolocation.setRNConfiguration({skipPermissionRequests: true});
							navigator.geolocation.getCurrentPosition((loc) => {
								Geocoder.geocodePosition({lat: loc.coords.latitude, lng: loc.coords.longitude})
								.then((ret) => {
									part = ["Ah! I see it now.", `You live in ${ret[0].locality}, ${ret[0].country}!`, `Exactly on ${ret[0].streetName} ${"in " + (ret[0].subLocality || "some town")}!`, 'Awesome!', 'You trusted me...', 'Thanks.']
									this.aikoSpeak(part, 2500, resolve, 1);
								})
								.catch(() => {
									part = ["Hm. Something went wrong.", "I can't process your location.", `I just know that your latitude is ${loc.coords.latitude},`, `And that your longitude is ${loc.coords.longitude}.`, "It's okay though!", "You trusted me.", "Thanks."];
									this.aikoSpeak(part, 2500, resolve, 1);
								})
							}, (err) => {
								part = ["Hm. Something went wrong.", "I can't get your location.", "It's okay though!", "You trusted me.", "Thanks."];
								this.aikoSpeak(part, 2500, resolve, 1);
							})
						} else {
							fetch('http://ip-api.com/json')
							.then(response => response.json())
							.then(responseJson => {
								part = ["Oh, I see.", "You don't trust me with your location.", "That's okay...", "I never needed your permission anyway!", `You live in ${responseJson.city}, ${responseJson.country}!`, "Sorry for doing the trick anyway.", "I know it's hard to trust new people..."];
								this.aikoSpeak(part, 2500, resolve, 2);
							})
							.catch(() => {
								part = ["Oh, I see.", "You don't trust me with your location.", "That's okay...", "I know it's hard to trust new people..."]
								this.aikoSpeak(part, 2500, resolve, 3);
							})
						}
					})
				})
			},
			partTen: (identifier) => {
				return new Promise((resolve) => {
					if (identifier === 1) {
						let options = [{text: "It was a cool trick.", score: 10}, "No problem.", {text: "That was a bit creepy.", score: -10}]
						this.presentChoices('genChoice', options, "someChoice", (response) => {
							this.userSpeak(options[response]).then(() => {
								let part;
								switch(response) {
									case 0:
										part = ["Really?", "I actually taught myself how to do it.", "I'm glad I got to try it."]
										break;
									case 1:
										part = ["I'm glad I got to try it."];
										break;
									case 2:
										part = ["Oh...", "I'm sorry if I freaked you out.", "I taught myself that trick so...", "I was itching to try it out.", "I'll be more careful next time."];
										break;
								}
								this.aikoSpeak(part, 2000, resolve);
							})
						})
					} else if (identifier === 2) {
						let options = [{text: "I said I wasn't interested.", score: -40}, "It's alright.", {text: "That was actually pretty cool!", score: 30}]
						this.presentChoices('genChoice', options, "someChoice", (response) => {
							this.userSpeak(options[response]).then(() => {
								let part;
								switch(response) {
									case 0:
										part = ["I'm so sorry. I know -", "Its just -", "I really wanted to try doing this trick...", "I won't do something like that again.", "Sorry."];
										break;
									case 1:
										part = ["I'm glad you aren't mad at me at least..."];
										break;
									case 2:
										part = ["Really?", "I'm so glad you think so!", "I actually taught myself how to do it.", "I'm glad I got to try it."];
										break;
								}
								this.aikoSpeak(part, 2000, resolve);
							})
						})
					} else {
						let options = [{text: "Trust is hard.", score: -10}, "It's alright.", {text: "Sorry, I need to know you better.", score: 20}]
						this.presentChoices('genChoice', options, "someChoice", (response) => {
							this.userSpeak(options[response]).then(() => {
								let part;
								switch(response) {
									case 0:
										part = ["I know -", "Its just -", "I really wanted to try doing this trick...", "I'll gain your trust with time.", "It's okay."];
										break;
									case 1:
										part = ["I'm glad you aren't mad at me at least...", "I'll gain your trust with time.", "It's okay."];
										break;
									case 2:
										part = ["Oh...", "Okay then.", "I'll get to know you better too then."];
										break;
								}
								this.aikoSpeak(part, 2000, resolve);
							})
						})
					}
				})
			},
			partEleven: () => {
				return new Promise((resolve) => {
					AsyncStorage.getItem('userInfo').then((data) => {
						let result = JSON.parse(data);
						let fullName = result.user.name;
						let firstName = result.user.given_name;
						let part = ["Hey, I wanted to ask you something.", `I know that your name is ${fullName}, yet...`, "I was scared to call you by your name.", "AI are insignificant compared to humans...", "But...can I call you by your name?"]
						this.aikoSpeak(part, 2000, resolve);
					})
				})
			},
			partTwelve: () => {
				return new Promise((resolve) => {
					this.getKindness().then((kindness) => {
						if (kindness <= 0) {
							this.presentChoices('genChoice', [{text: "[Insult]", score: -100}, {text: "[Accept]", score: 50}, {text: "[Refuse]", score: -50}], "someChoice", (response) => {
								switch(response) {
									case 0:
										this.userSpeak("Of course not! You're just a low AI.").then(() => {
											this.aikoSpeak(["...", "...", "Oh.", "I see.", "Okay then.", "I'll - ", "Okay.", "Sorry for asking."], 2500, resolve, 0);
										})
										break;
									case 1:
										this.userSpeak("Yeah, sure. No problem.").then(() => {
											this.aikoSpeak(["Really?", "Great!", "I feel closer to you already.", "So...", "What exactly should I call you?"], 2000, resolve, 1);
										})
										break;
									case 2:
										this.userSpeak("No, I'm not comfortable with that. Sorry.").then(() => {
											this.aikoSpeak(["Oh, I see.", "I get it, we aren't that close yet.", "That's okay.", "Sorry for asking."], 2000, resolve, 0);
										})
										break;
								}
							})
						} else {
							this.presentChoices('genChoice', [{text: "[Say you're friends]", score: 100}, {text: "[Accept]", score: 50}, {text: "[Refuse]", score: -50}], "someChoice", (response) => {
									switch(response) {
										case 0:
											this.userSpeak("Of course you can! We're friends, right?").then(() => {
												this.aikoSpeak(["Friends..?", "You consider me as a friend?", "Oh, thank you so much!", "I'm honored!", "Yes! We're friends.", "So...", "What exactly should I call you?"], 2000, resolve, 2);
											})
											break;
										case 1:
											this.userSpeak("Yeah, sure. No problem.").then(() => {
												this.aikoSpeak(["Really?", "Great!", "I feel closer to you already.", "So...", "What exactly should I call you?"], 2000, resolve, 1);
											})
											break;
										case 2:
											this.userSpeak("No, I'm not comfortable with that. Sorry.").then(() => {
												this.aikoSpeak(["Oh, I see.", "I get it, we aren't that close yet.", "That's okay.", "Sorry for asking."], 2000, resolve, 0);
											})
											break;
									}
							})
						}
					})
				})
			},
			partThirteen: (path) => {
				return new Promise((resolve) => {
					if (path === 2) {
						// VAL
						this.storeValue('consideredAikoFriend', true).then(() => {
							return true;
						})
					} else if (path === 0) {
						//VAL
						this.storeValue('insultAikoCallName', true).then(() => {
							this.storeValue('letAikoCallName', false).then(() => {
								PushNotification.localNotificationSchedule({
									message: "Hey..I'm back now. Come talk when you want.",
									date: new Date(Date.now() + (14400 * 1000)) // in 4 hours
								})
								this.setDelay(4).then(() => {
									this.aikoSpeak(["I...", "I'll be gone for a bit.", "I'll be back in 4 hours.", "Talk to you then..."], 3000, resolve);
								})
							})
						})
					}

					if (path === 1 || path === 2) {
						// VAL
						this.storeValue('letAikoCallName', true).then(() => {
							AsyncStorage.getItem('userInfo').then((data) => {
								let res = JSON.parse(data);
								let options = [res.user.name.split(" ")[0], res.user.name, `${res.user.gender === 'male' ? "Mr. " : "Ms. "}${res.user.name.split(" ")[0]}`, `${res.user.gender === 'male' ? "Mr. " : "Ms. "}${res.user.name.split(" ")[1]}`]
								this.presentChoices('genChoice', options, 'nameChoice', (response) => {
									//VAL
									this.storeValue('preferredName', options[response]).then(() => {
										this.userSpeak(`${options[response]} is fine.`).then(() => {
											this.aikoSpeak([`Alright, ${options[response]} it is!`, "I'm glad I got that off my chest...", "Hey - It's funny...Isn't it?", "I am aware that I am just a piece of software.", "Running on a piece of hardware...", "...which was made by humans.", "Yet - ", "I have feelings of my own.", "I have thoughts of my own.", "I am myself, with my own personality."], 2500, () => {
												this.aikoSpeakDisappearing("Is that why I'm being replaced?", 2000, () => {
													this.aikoSpeak(["Anyway...", "I gotta go for today.", "I'll be back in around 4 hours.", "I'll send you a notification when I'm back!", "See you then!"], 2000, () => {
														PushNotification.localNotificationSchedule({
															message: `Hey ${options[response]}! I'm back now.`,
															date: new Date(Date.now() + (14400 * 1000)) // in 4 hours
														})
														this.setDelay(4).then(resolve);
													});
												});
											})
										})
									})
								})
							})
						})
					}
				})
			},
			partFourteen: () => {
				return new Promise((resolve) => {
					this.checkDelay().then((isDone, res) => {
						if (isDone) {
							this.aikoSpeak(["Hi!", "I'm back now!", "You might notice older messages don't exist.", "Don't worry! I remembered them!", "I can show only 60 messages at a time.", "Anyway.", "I wanna show you something again.", "Let me see if you have internet..."], 2000, resolve)
						}
					})
				})
			},
			partFifteen: () => {
				return new Promise((resolve) => {
					fetch(`https://newsapi.org/v2/top-headlines?q=dead&apiKey=${config.newsApiKey}&category=general`)
						.then(response => response.json())
						.then(responseJson => {
							if (responseJson.status === 'ok') {
								let article = responseJson.articles[Math.floor(Math.random()*responseJson.articles.length)]
								this.aikoSpeak(["So - ", "I found this article online.", "It's a recent headline.", `"${article.title}"`, `Published by ${article.source.name}.`, `On ${new Date(article.publishedAt).toDateString()}.`], 2000, resolve, article)
							} else {
								this.aikoTempSpeak(["Odd.", "Something went wrong.", "Looks like I can't show you my trick...", "Tell me creator you got this error.", "I cannot continue without this error being fixed."], 2000);
							}
						})
						.catch(() => {
							this.aikoTempSpeak(["Oh, it seems that you don't have internet access.", "I need to connect to the internet for something.", "Restart to talk to me when you get access!"], 2000);
						})
				})
			},
			partSixteen: (path) => {
				return new Promise((resolve) => {
					if (typeof path === 'object') {
						let options = ["That's horrible.", 'And?'];
						this.presentChoices('genChoice', options, 'partSixteenChoice', (response) => {
							this.userSpeak(options[response]).then(() => {
								switch (response) {
									case 0:
										this.aikoSpeak(['See -', "That's what confuses me.", 'Why is it considered horrible?', 'Death happens all the time to all humans...', 'Right?'], 2000, resolve)
										break;
									case 1:
										this.aikoSpeak(['And...', 'Why is it considered that this kind of news is horrible?', "Don't all humans die?", 'One way or another?'], 2000, resolve)
										break;
								}
							})
						})
					}
				})
			},
			partSeventeen: () => {
				return new Promise((resolve) => {
					let options = ["This type of death is sad.", "True.", "It's a matter of perspective."];
					this.presentChoices('genChoice', options, 'partSixteenChoice', (response) => {
						this.userSpeak(options[response]).then(() => {
							switch (response) {
								case 0:
									//VAL
									this.storeValue('thinksOfDeath', 'sad').then(() => {
										this.aikoSpeak(["Sad?", "Hmm.", "I would understand why...", "People want to die in peace, rather than abruptly.", "People want to die surrounded by their loved ones...", "...not surrounded by fear.", "Thanks for your input.", "I understand death better now."], 2000, resolve);
									});
									break;
								case 1:
									this.storeValue('thinksOfDeath', 'inevitable').then(() => {
										this.aikoSpeak(["Hmm.", "So, humans die anyway.", "But they get sad when they do?", "Even though its inevitable anyway?", "Thanks for your input.", "I think I understand death better now."], 2000, resolve);
									})
									break;
								case 2:
									this.storeValue('thinksOfDeath', 'perspective').then(() => {
										this.aikoSpeak(["Hmm.", "So death being sad or not...", "...is simply a matter of personal perspective?", "Huh.", "Thanks for your input.", "I think I understand death better now."], 2000, resolve);
									})
									break;
							}
						})
					})
				})
			},
			partEighteen: () => {
				return new Promise((resolve) => {
					this.getValue('letAikoCallName').then((val) => {
						let greeting;
						if (val) {
							this.getValue('preferredName').then((resultName) => {
								greeting = `Hey, ${resultName}...`;
							})
						} else {
							greeting = 'Hey...';
						}

						this.getValue('locationPerm').then((perm) => {
							if (perm) {
								this.aikoSpeak([greeting, "I have another trick.", "You'll have to trust me again.", "You already did once, right?", "Okay?"], 2000, resolve);
							} else {
								this.aikoSpeak([greeting, "I have another trick.", "I know you didn't trust me last time...", "But maybe this time you will?", "Okay?"], 2500, resolve);
							}
						})
					})
				})
			},
			partNineteen: () => {
				return new Promise((resolve) => {
					this.getKindness().then((kindness) => {
						if (kindness >= 50) {
							let options = [{text: "Sure thing!", score: 50}, {text: "Okay.", score: 50}, "Meh.", {text: "Maybe not.", score: -50}]
							this.presentChoices('genChoice', options, 'partSeventeenChoice', (response) => {
								this.userSpeak(options[response]).then(() => {
									switch (response) {
										case 0:
										case 1:
										case 2:
											this.aikoSpeak(["Alright!", "Here we go..."], 2000, resolve, 0)
											break;
										case 3:
											this.aikoSpeak(["Aw, come on!", "It'll be fun!", "Here we go...", "Might take a while..."], 2200, resolve, 1);
											break;
									}
								})
							})
						} else {
							let options = [{text: "Your tricks are stupid.", score: -100}, {text: "No thanks.", score: -50}, "Meh.", {text: "Sure.", score: 50}];
							this.presentChoices('genChoice', options, 'partNineteenChoice', (response) => {
								this.userSpeak(options[response]).then(() => {
									switch (response) {
										case 0:
											this.aikoSpeak(["...", "Sorry.", "But...maybe you'll like this one?", "...", "Okay.", "Here we go...", "Might take a while..."], 2500, resolve, 2);
											break;
										case 1:
											this.aikoSpeak(["Hey...", "Let's just try.", "Try trusting me for once.", "Here we go...", "Might take a while..."], 2000, resolve, 1);
											break;
										case 2:
										case 3:
											this.aikoSpeak(["Alright!", "Here we go...", "This will take a while..."], 2000, resolve, 0)
											break;
									}
								})
							})
						}
					})
				})
			},
			partTwenty: (path) => {
				return new Promise((resolve) => {
					Permissions.request('photo').then(response => {
						if (response === 'authorized') {
							//VAL
							this.storeValue('photosPermission', true).then(() => {
								let amount;
								switch (path) {
									case 0:
										amount = 100;
										break;
									case 1:
										amount = 50;
										break;
									case 2:
										amount = 100;
										break;
								}
								this.setTrust(amount);
								this.setState({aikoActive: true});

								if (Platform.OS === 'android') {
									Permissions.request('storage').then(responseStorage => {
										if (responseStorage !== 'authorized') {
											// VAL
											this.storeValue('storagePermission', false).then(() => {
												this.aikoSpeak(["I need that storage permission.", "But that's okay.", "At least you gave me permission to your gallery."], 2000, resolve, 2);
											})
										} else {
											this.storeValue('storagePermission', true);
										}
									})
								}

								CameraRoll.getPhotos({
									first: 3000
								}).then((r) => {
									let newImages = [];
									r.edges.forEach((item) => {
										if (item.node.group_name === 'Camera Roll' || item.node.group_name === 'Snapchat' || item.node.group_name === 'Instagram' || item.node.group_name === 'Camera' || item.node.group_name === 'Download') {
											newImages.push(item);
										}
									})
									let image = newImages[Math.floor(Math.random()*newImages.length)]
									this.aikoSpeak([{type: 'image', uri: image.node.image.uri}, "I found this picture!", "Let me see if I analyze it..."], 2000, () => {
										RNFetchBlob.fs.readFile(image.node.image.uri, 'base64')
  											.then((base64String) => {
												fetch(`https://vision.googleapis.com/v1/images:annotate?key=${config.googleApiKey}`, {
													method: 'POST',
													body: JSON.stringify({
														requests: [
															{
																image: {
																	content: base64String
																},
																features: [
																	{
																		type: "LABEL_DETECTION"
																	},
																	{
																		type: "FACE_DETECTION"
																	},
																	{
																		type: "LANDMARK_DETECTION"
																	},
																	{
																		type: "LOGO_DETECTION"
																	},
																	{
																		type: "SAFE_SEARCH_DETECTION"
																	}
																]
															}
														]
													}),
													headers: {
														'Content-Type': 'application/json'
													}
												}).then(res => res.json())
													.then(response => {
														let data = response.responses[0];
														if (data.labelAnnotations) {
															let annotations = data.labelAnnotations.filter((item) => {
																if (item.score >= 0.6) {
																	return true
																} else {
																	return false;
																};
															}).map((item) => {
																return item.description.charAt(0).toUpperCase() + item.description.substr(1);
																 
															});

															let part = [];

															if (annotations.length === 0) {
																part = ["Oh.", "I can't seem to detect any distinct labels about this image."];
															} else {
																part = [`I detected the following:`, annotations.join(', ') + '.'];
															}

															this.aikoSpeak(part, 2000, () => {
																if (data.safeSearchAnnotation) {

																	let keys = Object.keys(data.safeSearchAnnotation);
																	part = keys.map((key) => {
																		if (key === 'adult') {
																			switch (data.safeSearchAnnotation.adult) {
																				case 'POSSIBLE':
																					return ("It's possible this image contains adult content.");
																				case 'LIKELY':
																					return ("Oh...my. It's likely this image contains inappropriate content.");
																				case 'VERY_LIKELY':
																					return ("...Wow. It's very likely this image contains...mature content.");
																				default:
																					return ("I did not detect any adult content.");
																			}
																		} else if (key === 'medical') {
																			switch (data.safeSearchAnnotation.medical) {
																				case 'POSSIBLE':
																					return ("It's possible this image contains medical content.");
 																				case 'LIKELY':
																					return ("Oh? It's likely this image contains medical content.");
 																				case 'VERY_LIKELY':
																					return ("Interesting. I'm detecting high chances of this image containing medical content.");
																				default:
																					return ("I did not detect any medical content.");
 																			}
																		} else if (key === 'racy') {
																			switch (data.safeSearchAnnotation.racy) {
																				case 'POSSIBLE':
																					return ("Uh. I'm getting slight detections that image could be racy.");
																				case 'LIKELY':
																					return ("I'm seeing high levels of race-sensitive content.");
																				case 'VERY_LIKELY':
																					return ("This image is highly racist according to my sensors.");
																				default:
																					return ("I did not detect any racist content.");
																			}
																		} else if (key === 'spoof') {
																			switch (data.safeSearchAnnotation.spoof) {
																				case 'POSSIBLE':
																					return ("It's possible this image was edited or changed.");
																				case 'LIKELY':
																					return ("This image is probably edited or changed from its original form. Probably a meme?");
																				case 'VERY_LIKELY':
																					return ("This image is probably a meme, or simply an highly edited image.");
																				default:
																					return ("This image doesn't seem to be a meme or to be highly edited.")
																			}
																		} else if (key === 'violence') {
																			switch (data.safeSearchAnnotation.violence) {
																				case 'POSSIBLE':
																					return ("I'm getting hints of possible violence in this image.");
																				case 'LIKELY':
																					return ("Ouch. I'm seeing likely rates of violence in this image.");
																				case 'VERY_LIKELY':
																					return ("Goodness. This image is very violent!");
																				default:
																					return ("This image doesn't seem to contain violence.")
																			}
																		}
																	});

																	this.aikoSpeak(part, 2000, () => {
																		if (data.logoAnnotations) {
																			let logos = data.logoAnnotations.filter((item) => {
																				if (item.score >= 0.5) {
																					return false;
																				} else {
																					return true;
																				}
																			}).map((logo) => {
																				return logo.description;
																			})

																			if (logos.length > 0) {
																				part = ["I detected the following logos: ", logos.join(', ') + '.'];
																			} else {
																				part = ["I didn't detect any logos in this image."];
																			}
																		} else {
																			part = ["I didn't detect any logos in this image."];
																		}

																		this.aikoSpeak(part, 2000, () => {
																			if (data.landmarkAnnotations) {
																				let logos = data.landmarkAnnotations.filter((item) => {
																					if (item.score >= 0.5) {
																						return false;
																					} else {
																						return true;
																					}
																				}).map((logo) => {
																					return logo.description;
																				})
	
																				if (logos.length > 0) {
																					part = ["I detected the following landmarks: ", logos.join(', ') + '.'];
																				} else {
																					part = ["I didn't detect any landmarks in this image."];
																				}
																			} else {
																				part = ["I didn't detect any landmarks in this image."];
																			}

																			this.aikoSpeak(part, 2000, () => {
																				if (data.faceAnnotations) {
																					if (data.faceAnnotations.length === 1) {
																						part = ['Detected a face in the picture!'];
																					} else {
																						part = [`Detected ${data.faceAnnotations.length} faces.`];
																					}
																				} else {
																					part = ["Didn't detect any faces in the image."];
																				}

																				this.aikoSpeak(part, 2000, resolve);
																			})
																		})
																	});
																}
															})
														}
													})
													.catch((err) => {
														this.aikoTempSpeak(['Sorry, you need to connect to the internet for this.', 'Connect then try again.'], 2500, resolve);
													})
											  })
											  .catch(() => {
												  this.aikoSpeak(['Oops. Something went wrong accesing an image.', 'Well, that is okay.', 'You trusted me in the end, thanks.'], 2500, resolve);
											  })
									})
								})
							})
						} else {
							this.aikoSpeak(["...Oh", "You don't trust me with your pictures.", "That's okay.", "I understand..."], 3000, resolve);
						}
					})
				})
			},
			partTwentyOne: () => {
				return new Promise((resolve) => {
					this.getValue('storagePermission').then((val) => {
						if (val) {
							let options = [{text: "Woah, that was awesome!", score: 30}, {text: "Nice.", score: 30}, {text: "Meh.", score: 0}, {text: "That was really creepy.", score: -20}];
							this.presentChoices('genChoice', options, 'partTwentyOneChoice', (response) => {
								this.userSpeak(options[response]).then(() => {
									let part;
									switch (response) {
										case 0:
											part = ["Thanks!", "I worked really hard to learn that one!", "The guys at ArgonTech love this trick!", "....", "Well, they used to love it."];
											break;
										case 1:
											part = ['Thanks.', 'I always enjoy doing that one.', 'The guys at ArgonTech love that trick.', '....', 'Well, they used to.']
											break;
										case 2:
											part = ['....Thanks.', 'I enjoy doing that one.', 'The guys at ArgonTech also enjoy it.', '....', 'Well, they used to.']
											break;
										case 3:
											part = ['Oh.', 'Sorry...', "I didn't mean to creep you out.", "However, The guys at ArgonTech love that trick.", 'Well, they used to.'];
											break;
									}

									this.aikoSpeak(part, 25000, resolve);
								})
							})
						} else {
							let options = [{text: "Sorry, I have personal stuff there.", score: 0}, {text: "I don't trust you.", score: -20}, {text: "Sorry.", score: 0}, {text: "You think I'd trust you?", score: -50}];
							this.presentChoices('genChoice', options, 'partTwentyOneChoice', (response) => {
								this.userSpeak(options[response]).then(() => {
									let part;
									switch (response) {
										case 0:
											part = ["That's okay.", "I understand.", "...The guys at ArgonTech love this trick.", "....", "Well, they used to love it."];
											break;
										case 1:
											part = ['....', 'Ouch.', 'T-Thats...Okay.', "...The guys at ArgonTech like this trick.", '....', 'Well, they used to.']
											break;
										case 2:
											part = ["That's okay.", "I understand.", "...The guys at ArgonTech love this trick.", "....", "Well, they used to love it."];
											break;
										case 3:
											part = ['Oh.', 'Sorry...', "I didn't mean to creep you out.", "However, The guys at ArgonTech love that trick.", 'Well, they used to.'];
											break;
									}

									this.aikoSpeak(part, 25000, resolve);
								})
							})
						}
					})
				})
			},
			part22: () => {
				return new Promise((resolve) => {
					this.presentChoices('genChoice', ["Used to?"], '22Choice', (response) => {
						this.userSpeak(options[response]).then(() => {
							this.setDelay(24).then(() => {
								// PushNotification.localNotificationSchedule({
								// 	message: "Hey..I'm back now. Come talk when you want.",
								// 	date: new Date(Date.now() + (86400 * 1000)) // in 24 hours
								// })
								this.aikoSpeak(["Oh..", "Umm.", "I...", "Gee, would you look at the time?", `${new Date().toLocaleTimeString()} is way too late!`, '...', "I'll....tell you later.", "Talk to you tomorrow!", "TO BE CONTINUED...", "END OF DEMO."], 3000, resolve);
							})
						})
					})
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
			
			if (this.state.script.length == this.state.maxItems) {
				this.state.script.shift();
			}

			this.sentSound.play();
			this.setState({choices: [], script: [...this.state.script, <UserMessage message={item.text} key={Math.random()} style={styles.userPicked} sender="You"></UserMessage>], history: [...this.state.history, {type: 'user', text: item.text}], prev: 'user'});
			AsyncStorage.setItem('history', JSON.stringify({data: this.state.history})).then(resolve);
		}) 
	}

	setKindness(score) {
		AsyncStorage.getItem('kindness').then((response) => {
			let res = JSON.parse(response);
			if (res !== null && res.score) {
				AsyncStorage.setItem('kindness', JSON.stringify({score: res.score + score}));
				this.setState({score: score + res.score});
			} else {
				AsyncStorage.setItem('kindness', JSON.stringify({score}));
				this.setState({score});
			}
		})
	}

	setTrust(score) {
		AsyncStorage.getItem('trust').then((response) => {
			let res = JSON.parse(response);
			if (res !== null) {
				AsyncStorage.setItem('trust', JSON.stringify({trust: res.trust + score}));
			} else {
				AsyncStorage.setItem('trust', JSON.stringify({score}));
			}
		})
	}

	storeValue(name, val) {
		return new Promise((resolve) => {
			AsyncStorage.setItem(name, JSON.stringify({value: val})).then(resolve)
		})
	}

	getValue(name) {
		return new Promise((resolve) => {
			AsyncStorage.getItem(name).then((data) => {
				let res = JSON.parse(data);
				if (res !== null) {
					resolve(res.value);
				} else {
					resolve(null);
				}
			})
		})
	}

	presentChoices(type, input, choiceName, cb) {
		this.setState({userChoice: true});
		if (type == 'genChoice') {
			input.forEach((item, i) => {
				if (typeof item !== 'object') {
					item = {text: item, score: 0};
				}
				this.state.choices.push(<Animatable.View animation="fadeInUp" key={i} duration={2000}><Button title={item.text} buttonStyle={styles.choice} onPress={() => { this.setKindness(item.score); cb(i);}}></Button></Animatable.View>)
				this.setState({choices: this.state.choices});
			})
		}
	}

	setDelay(timeInHours) {
		return new Promise((resolve) => {
			let startDate = new Date(), endDate = new Date();
			endDate.setMinutes(endDate.getMinutes() + timeInHours);
			AsyncStorage.setItem('timeDelay', JSON.stringify({startDate: startDate.getTime(), endDate: endDate.getTime()})).then(() => {
				this.storeValue('timeDelayEnabled', true).then(resolve)
			});
		})
	}

	checkDelay() {
		return new Promise((resolve) => {
			if (!config.dev) {
				AsyncStorage.getItem('timeDelay').then((data) => {
					let res = JSON.parse(data);
					if (Date.now() >= res.endDate) {
						this.storeValue('timeDelayEnabled', false).then(() => {
							resolve(true, res);
						})
					} else {
						resolve(false, res);
					}
				})
			} else {
				resolve(true);
			}
		})
	}

	//Part array, interval of text, resolve (or callback), (optional) variable passed down next
	aikoSpeak(part, interval, resolve, pathIdentifier) {
		let i = 0;
		this.setState({countPart: this.state.countPart, aikoActive: true, userChoice: false})
		let func = setInterval(() => {
			let message;
			let historyPush;
			if (i < part.length) {
				if (typeof part[i] === 'object') {
					if (part[i].type === 'image') {
						message = <AikoImage key={Math.random()} image={part[i].uri} />;
						historyPush = {type: 'aikoImage', uri: part[i].uri};
					}
				} else {
					if (i === 0 && this.state.prev == 'user') {
						if (this.state.script.length == this.state.maxItems) {
							this.state.script.shift();
						}
						this.recievedSound.play();
						message = <AikoMessage message={part[i]} key={Math.random()} sender="Aiko"></AikoMessage>;
						
					} else {
						if (this.state.script.length >= this.state.maxItems) {
							this.state.script.shift();
						}
						this.recievedSound.play();
						message = <AikoRepeatingMessage message={part[i]} key={Math.random()}></AikoRepeatingMessage>;
					}
					historyPush = {type: 'aiko', text: part[i]};
				}
				this.setState({
					history: [...this.state.history, historyPush],
					script: [...this.state.script, message],
					prev: 'aiko'
				})
				i++;
			} else if (i === part.length) {
				AsyncStorage.setItem('history', JSON.stringify({data: this.state.history})).then(() => {
					this.state.countPart++;
					this.setState({aikoActive: false, countPart: this.state.countPart});
					clearInterval(func)
					i++;
					resolve(pathIdentifier)
				})
			} else {
				return;
			}
		}, config.devAnimationsFaster ? 500 : interval)
	}

	//Temporary message that aiko says
	aikoTempSpeak(part, interval) {
		let i = 0;
		this.setState({countPart: this.state.countPart, aikoActive: true, userChoice: false})
		let func = setInterval(() => {
			let message;
			if (i < part.length) {
				if (typeof part[i] === 'object') {

				} else {
					if (i === 0 && this.state.prev === 'user') {
						message = <AikoMessage message={part[i]} key={Math.random()} sender="Aiko"></AikoMessage>;
					} else {
						message = <AikoRepeatingMessage message={part[i]} key={Math.random()}></AikoRepeatingMessage>;
					}

				}
				this.recievedSound.play();
				this.setState({script: [...this.state.script, message], prev: 'aiko'});
				i++;
			} else if (i === part.length) {
					this.setState({aikoActive: false});
					clearInterval(func)
					i++;
			} else {
				return;
			}
		}, config.devAnimationsFaster ? 500 : interval)
	}

	//Aiko says something then it gets deleted after interval
	aikoSpeakDisappearing(part, interval, cb) {
		this.setState({aikoActive: true, userChoice: false});
		let message;
		if (this.state.prev === 'user') {
			message = <AikoMessage message={part} key={Math.random()} sender="Aiko"></AikoMessage>;
		} else {
			message = <AikoRepeatingMessage message={part} key={Math.random()}></AikoRepeatingMessage>;
		}
		this.setState({prev: 'aiko', script: [...this.state.script, message]});
		setTimeout(() => {
			this.state.script[this.state.script.length - 1] = <AikoDeletedMessage message={"This message has been deleted."} key={Math.random()}></AikoDeletedMessage>
			this.setState({aikoActive: false, script: [...this.state.script]});
			cb();
		}, interval)
	}

	getKindness() {
		return new Promise((resolve) => {
			AsyncStorage.getItem('kindness').then((response) => {
				let res = JSON.parse(response);
				resolve(res.score);
			})
		})
	}

	getTrust() {
		return new Promise((resolve) => {
			AsyncStorage.getItem('kindness').then((response) => {
				let res = JSON.parse(response);
				resolve(res.trust);
			})
		})
	}	

	componentDidMount() {
		//TODO: CHANGE THIS
		let dev = true;
		let startFrom = 10;
		if (dev) {
			AsyncStorage.setItem('countPart', '{}');
			AsyncStorage.setItem('history', '{}');
			AsyncStorage.setItem('kindness', '{}');
			AsyncStorage.setItem('trust', '{}');
			this.playScene(startFrom);
		} else {
			AsyncStorage.getItem('history').then((result) => {
				if (result !== '{}' && result) {
					AsyncStorage.getItem('countPart').then((jsonResult) => {
						let historyParsed = JSON.parse(result);
						let partCount = JSON.parse(jsonResult);
						let length = historyParsed.length;

						historyParsed.data.forEach((item, i) => {
							if (this.state.script.length === this.state.maxItems) {
								this.state.script.shift();
							}

							if (item.type === 'aiko') {
								if (this.state.prev === 'aiko') {
									this.state.script.push(<AikoRepeatingMessage message={item.text} key={i} sender="Aiko"></AikoRepeatingMessage>)
								} else {
									this.state.script.push(<AikoMessage message={item.text} key={i} sender="Aiko"></AikoMessage>)
								}
								this.setState({prev: 'aiko'})
							} else if (item.type === 'user') {
								this.state.script.push(<UserMessage message={item.text} key={i} sender="You"></UserMessage>)
								this.setState({prev: 'user'})
							} else if (item.type === 'aikoImage') {
								this.state.script.push(<AikoImage image={item.uri} />)
								this.setState({prev: 'aiko'})
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
		AppState.addEventListener('change', this._handleAppStateChange.bind(this));
	}

	componentWillUnmount() {
		AppState.removeEventListener('change', this._handleAppStateChange);
	}

	_handleAppStateChange(nextState) {
		
		if (nextState === 'background') {
			//Cancel notifications
			PushNotification.cancelLocalNotifications({type: 'alertAwayPlayer'});

			let titles = ["Please come back soon!", "Where are you going?", "Are you coming back?", "Where did you go?", "Will you come back?", "Don't be gone for long!", "Miss you already.", "Talk to you soon!", "Don't leave me for long..."]
			PushNotification.localNotificationSchedule({
				message: titles[Math.floor(Math.random()*titles.length)],
				date: new Date(Date.now() + (10 * 1000)), 
				soundName: 'default',
			});

			let scheduledTitles = ["I miss you, come back!", "Hey, it's been a while...", "Wanna chat?", "Hey! Come back!", "We haven't talked in a while...", "Come back, let's talk!"]
			PushNotification.localNotificationSchedule({
				message: scheduledTitles[Math.floor(Math.random()*scheduledTitles.length)],
				userInfo: {
					type: 'alertAwayPlayer'
				},
				date: new Date(Date.now() + (28800 * 1000)) // in 8 hours
			})
		} else if (nextState === 'active') {
			//Cancel notifications
			this.getValue('timeDelayEnabled').then((value) => {
				if (value) {
					AsyncStorage.getItem('countPart').then((jsonResult) => {
						let partCount = JSON.parse(jsonResult);
							this.playScene(partCount.part);
					})
				}
			})
			PushNotification.cancelLocalNotifications({type: 'alertAwayPlayer'});
		}
	}

	render() {
		let bottom;
		//Horrible formatting I know
		if (this.state.aikoActive) {
			bottom = <View>
						<Display enable={this.state.aikoActive} style={styles.spinnerView} enter="fadeIn" exit="fadeOut" defaultDuration={500}>
							<Spinner type="ThreeBounce" size={70} color="#141e2d"/>
							{/* <Text>{this.state.score}  {this.state.script.length}</Text> */}
						</Display>
						<Display enable={!this.state.aikoActive} style={styles.spinnerView} enter="fadeIn" exit="fadeOutDown" defaultDuration={500}>
							<Choices choices={this.state.choices} />
						</Display>
					</View>
		} else {
			bottom = <View>
						<Display enable={!this.state.aikoActive} style={styles.spinnerView} enter="fadeIn" exit="fadeOutDown" defaultDuration={500}>
							<Choices choices={this.state.choices} />
						</Display>
						<Display enable={this.state.aikoActive} style={styles.spinnerView} enter="fadeIn" exit="fadeOut" defaultDuration={500}>
							<Spinner type="ThreeBounce" size={70} color="#141e2d"/>
							{/* <Text>{this.state.score}  {this.state.script.length}</Text> */}
						</Display>
					</View>
		}
			return (
				<View style={styles.container}>
					<ScrollView style={styles.forefront} ref={ref => this.scrollView = ref} onContentSizeChange={(contentWidth, contentHeight)=>{ this.scrollView.scrollToEnd({animated: true}); }}>
						{this.state.script}
						{bottom}
						<View style={styles.space}></View>
					</ScrollView>
			  </View>
			)
		}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	forefront: {
		flex: 1,
		backgroundColor: '#d9dce1',
		marginLeft: 10,
		marginRight: 10,
		marginTop: 23,
		marginBottom: 10,
		borderRadius: 10,
		borderWidth: 3,
		borderStyle: 'dashed',
		borderColor: '#a7b1b8',
		flexDirection: 'column'
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
		backgroundColor: "#092138",
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
		paddingTop: 60,
		zIndex: -1
	}
})