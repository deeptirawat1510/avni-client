import {Text, StyleSheet, View, Image} from 'react-native';
import React, {Component} from 'react';
import AppState from "../../hack/AppState";
import I18n from '../../utility/Messages'

class AnswerOption extends Component {
    static propTypes = {
        answer: React.PropTypes.string.isRequired,
        answerList: React.PropTypes.object.isRequired
    };

    static contextTypes = {
        navigator: React.PropTypes.func.isRequired
    };

    static styles = StyleSheet.create({
        answerRow: {
            marginTop: 10,
            height: 45,
            marginLeft: 30,
            marginRight: 30,
            flex: 1,
            flexDirection: 'row',
            backgroundColor: '#A8DADC'
        },
        item: {
            color: '#000000',
            margin: 10,
            textAlign: 'left',
            textAlignVertical: 'center',
            fontSize: 18,
            flex: 0.7
        },
        checkImage: {
            flex: 0.2,
            resizeMode: 'contain',
            height: 45
        }
    });

    displayCheckImage() {
        if (AppState.questionnaireAnswers.currentAnswer === this.props.answer) {
            return (<Image style={AnswerOption.styles.checkImage}
                           source={require('../../../../android/app/src/main/res/mipmap-mdpi/check.png')}
            />)
        }
    }

    handleOnPress(self) {
        AppState.questionnaireAnswers.currentAnswer = self.props.answer;
        self.props.answerList.onChange();
    }

    render() {
        return (
            <View style={AnswerOption.styles.answerRow}>
                <Text style={AnswerOption.styles.item} onPress={() => this.handleOnPress(this)}>
                    {I18n.t(this.props.answer)}
                </Text>
                {this.displayCheckImage()}
            </View>
        );
    }
}

export default AnswerOption;