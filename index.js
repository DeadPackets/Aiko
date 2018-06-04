/* eslint-disable */
import React, {
	Component
} from 'react';

import {
	AppRegistry,
	Platform,
	StyleSheet,
	Linking,
	AsyncStorage,
	StatusBar,
	Text,
	View
} from 'react-native';

//import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/FontAwesome';
import SplashScreen from 'react-native-splash-screen'

//Acts
import ActOne from './acts/one';

export default class App extends Component {
	constructor() {
		super();
		this.state = {
			loading: true,
			alreadyStarted: false,
			firstStart: true
		}
	}

	componentWillMount() {
		AsyncStorage.getItem('userInfo').then((response) => {
			if (response) {
				const data = JSON.parse(response);
				this.setState({firstStart: false});
			}
		})
	}

	render() {
			return (
				<View style={styles.container}>
				<StatusBar barStyle="light-content"/>
					<ActOne />
				</View>
			)
	}
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#49446C',
		flex: 1
	},
	mainTitle: {
		fontSize: 64
	}
  });

AppRegistry.registerComponent('Aiko', () => App);
