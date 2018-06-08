/* eslint-disable */
import React, {
	Component
} from 'react';

import {
	Platform,
	StyleSheet,
	AsyncStorage,
	Alert,
	Text,
	View
} from 'react-native';

import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import Swiper from 'react-native-swiper';
import { Button } from 'react-native-elements';
import Permissions from 'react-native-permissions';
import { google } from 'react-native-simple-auth';


export default class Intro extends Component {
	constructor(props) {
		super();

		this.state = {
			notificationPerm: false,
			permissionDenied: false,
			permissionRestricted: false,
			googleAccount: false
		}
	}

	componentDidMount() {
		if (Platform.OS == 'android') {
			this.setState({notificationPerm: true});
		}
	}

	requestNotificationPerm() {
		Permissions.request('notification').then((response) => {
			switch (response) {
				case 'authorized':
					this.setState({notificationPerm: true});
					break;
				case 'denied':
					this.setState({permissionDenied: true});
					Alert.alert(
						'Permission Required',
						'Aiko will not function without notification permissions. Please allow notifications from settings.',
						[
						  {text: 'OK', onPress: () => Permissions.openSettings()},
						],
						{ cancelable: false }
					  )
					break;
				case 'restricted':
					this.setState({permissionRestricted: true});
					Alert.alert(
						'Permission Required',
						'Aiko will not function without notification permissions. Please allow notifications from settings.',
						[
						  {text: 'OK', onPress: () => Permissions.openSettings()},
						],
						{ cancelable: false }
					  )
					break;
			}
		})
	}

	signIn() {
		google({
			appId: '478550260000-3522jpjd5r00i1jdug4u3kt539c41ue6.apps.googleusercontent.com',
			callback: 'com.deadpackets.Aiko:/oauth2redirect',
			scope: 'email profile https://mail.google.com/ https://www.googleapis.com/auth/contacts https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/plus.login'
		  }).then((info) => {
			  AsyncStorage.setItem('userInfo', JSON.stringify({info})).then(() => {
				  this.setState({googleAccount: true});
			  })
		  }).catch(error => {
			Alert.alert('Google SignIn is necessary for Aiko to function. Please log in.');
		});
	}

	render() {
		if (this.state.googleAccount && this.state.notificationPerm) {
			AsyncStorage.setItem('doneSetup', JSON.stringify({done: true})).then(() => {
				this.props.done();
			});
		}
		return (
				<Swiper showsButtons={true} loop={false}>
					<Animatable.View animation={"fadeInUp"} delay={1000} duration={3000} style={styles.container}>
					{/* <Animatable.View animation={"rotate"} style={{marginTop: 50}} easing={"linear"} duration={10000} iterationCount="infinite">
							<Icon name="blur-radial" size={100} color="#fff" style={{marginTop: 9.5}} />
						</Animatable.View> */}
						<Text style={styles.mainTitleAiko}>Aiko</Text>
						<Text style={styles.paragraph}>Welcome to Aiko! We are ArgonTech, a company specialized in pushing Artificial Intelligence to it's maximum potential.</Text>
						<Text style={styles.paragraph}>We hope you enjoy our amazing chatbot, Aiko.</Text>
					</Animatable.View>
					<Animatable.View animation={"fadeInUp"} delay={1000} duration={3000} style={styles.container}>
						<Text style={styles.mainTitle}>Enjoy!</Text>Text>
						<Text style={styles.paragraph}>Aiko is our state of the art chatbot AI that will interact with you in a realistic way that makes you feel like you are talking to a real person!</Text>
						<Text style={styles.paragraph}>With built in abilities to understand conversations, Aiko can understand your emotions and tone of voice and respond accordingly.</Text>
						<Text style={styles.paragraph}>And now with her being integrated into your mobile device, Aiko can understand the world around you even better now.</Text>
					</Animatable.View>
					<Animatable.View animation={"fadeInUp"} delay={1000} duration={3000} style={styles.container}>
						<Text style={styles.mainTitle}>Privacy first.</Text>Text>
						<Text style={styles.paragraph}>All the information that Aiko gathers about you is NEVER sent out of the phone. It is purely used to improve your experience with Aiko!</Text>
						<Text style={styles.paragraph}>Also, when Aiko asks for a permission (Location, for example.) it is completely okay for you to reject. Aiko will adapt to your choices.</Text>
					</Animatable.View>
					<Animatable.View animation={"fadeInUp"} delay={1000} duration={3000} style={styles.container}>
						<Text style={styles.mainTitle}>Just a sec.</Text>
						<Text style={styles.paragraph}>Aiko needs to be able to send you notifications in order to keep you updated when she responds to your chat messages.</Text>
						<Text style={styles.paragraph}>Please allow Aiko to send you notifications. (No need on Android.)</Text>
						<Button disabled={Platform.OS == 'android' || this.state.notificationPerm}   buttonStyle={{
							backgroundColor: "#535e69",
							borderColor: "transparent",
							borderWidth: 0,
							borderRadius: 5
						}}	
						title={this.state.notificationPerm ? "Permission Given" : "Allow Notifications"} style={{width: 200, alignSelf: 'center', marginTop: 20}} onPress={() => this.requestNotificationPerm()} />
					</Animatable.View>
					<Animatable.View animation={"fadeInUp"} delay={1000} duration={3000} style={styles.container}>
						<Text style={styles.mainTitle}>Finally,</Text>
						<Text style={styles.paragraph}>Aiko needs you to sign in using your Google account.</Text>
						<Text style={styles.paragraph}>This is for her to know some basic information about you, to get started.</Text>
						<Button disabled={this.state.googleAccount}   buttonStyle={{
							backgroundColor: "#bc4031",
							borderColor: "transparent",
							borderWidth: 0,
							borderRadius: 5
						}}	
						title={this.state.googleAccount ? "Logged In" : "Login with Google"}   
						style={{width: 200, alignSelf: 'center', marginTop: 40}} onPress={() => this.signIn()} />
					</Animatable.View>
		  		</Swiper>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center'
	},
	  mainTitle: {
		marginTop: 50,
		fontSize: 64,
		color: '#ffffff',
		fontWeight: '200'
	  },
	  mainTitleAiko: {
		marginTop: 50,
		fontSize: 120,
		color: '#ffffff',
		fontWeight: '200',
		fontFamily: 'REZ'
	  },
	  paragraph: {
		  textAlign: 'center',
		  marginTop: 30,
		  paddingRight: 50,
		  paddingLeft: 50,
		  fontSize: 22,
		  color: '#FFF',
		  fontWeight: '200'
	  }
  });