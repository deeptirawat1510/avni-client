import React from "react";
import AbstractComponent from "../framework/view/AbstractComponent";
import Path from "../framework/routing/Path";
import {
    Alert,
    Dimensions,
    Modal,
    StatusBar,
    Text,
    TouchableNativeFeedback,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import TextFormElement from "./form/formElement/TextFormElement";
import StaticFormElement from "./viewmodel/StaticFormElement";
import {LoginActionsNames as Actions} from '../action/LoginActions';
import Distances from './primitives/Distances';
import {PrimitiveValue} from "openchs-models";
import Reducers from "../reducer";
import CHSNavigator from "../utility/CHSNavigator";
import CHSContainer from "./common/CHSContainer";
import CHSContent from "./common/CHSContent";
import themes from "./primitives/themes";
import Styles from "./primitives/Styles";
import Colors from "./primitives/Colors";
import _ from "lodash";
import {Button, CheckBox, Spinner} from "native-base";
import General from "../utility/General";
import AuthService from "../service/AuthService";
import ConfirmationModal from "./common/ConfirmationModal";

@Path('/loginView')
class LoginView extends AbstractComponent {
    constructor(props, context) {
        super(props, context, Reducers.reducerKeys.loginActions);
        this.safeLogin = this.safeLogin.bind(this);
        this.clearDataAndLogin = this.clearDataAndLogin.bind(this);
    }

    componentDidMount() {
        this.dispatchAction(Actions.ON_LOAD);
    }

    reset() {
        const userIdBeforeReset = this.state.userId;
        const passwdBeforeReset = this.state.password;
        this.dispatchAction('RESET');
        this.dispatchAction(Actions.ON_LOAD);
        this.dispatchAction(Actions.ON_USER_ID_CHANGE, {value: userIdBeforeReset});
        this.dispatchAction(Actions.ON_PASSWORD_CHANGE, {value: passwdBeforeReset});
    }

    loginComplete(response) {
        const backFunction = _.get(this.props, 'params.backFunction');
        this.dispatchAction(Actions.ON_STATE_CHANGE, {
            newState: {
                loginSuccess: true,
                loginError: "",
                loggingIn: false
            }
        });

        if (backFunction) {
            backFunction(this);
        } else {
            CHSNavigator.navigateToLandingView(this, true, {tabIndex: 1, menuProps: {startSync: true}});
        }
    }

    loginFailure(loginError) {
        this.dispatchAction(Actions.ON_STATE_CHANGE, {
            newState: {
                loginSuccess: false,
                loginError: loginError,
                loggingIn: false
            }
        });
    }

    newPasswordRequired(user) {
        this.dispatchAction(Actions.ON_STATE_CHANGE, {
            newState: {
                loginSuccess: true,
                loginError: "",
                loggingIn: false
            }
        });
        CHSNavigator.navigateToSetPasswordView(this, user);
    }

    forgotPassword() {
        CHSNavigator.navigateToForgotPasswordView(this);
    }

    cancelLogin() {
        CHSNavigator.navigateToLandingView(this);
    };

    viewName() {
        return "LoginView";
    }

    errorMessage() {
        const error = this.state.loginError || '';
        return error.slice(error.indexOf(":") + 1).trim();
    }

    spinner() {
        return this.state.loggingIn ? (
            <View style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                backgroundColor: Colors.defaultBackground
            }}>
                <Spinner/>
            </View>
        ) : <View/>
    }

    renderMultiUserLoginFailure() {
        return (<ConfirmationModal
            visible={this.state.showMultiUserLoginWarning}
            hide={(actionFn) => this.setState({showMultiUserLoginWarning: false}, actionFn)}
            negative={{action: this.clearDataAndLogin, label: this.I18n.t('clearDataAndLogin')}}
            positive={{action: _.noop, label: this.I18n.t('cancel')}}
            title={this.I18n.t("cannotChangeUserTitle", {newUser: this.state.userId})}
            desc={this.I18n.t("cannotChangeUserDesc", {oldUser: this.state.loggedInUser, newUser: this.state.userId})}
        />);
    }

    render() {
        General.logDebug(this.viewName(), 'render');
        return (
            <CHSContainer theme={themes}>
                <CHSContent>
                    {this.renderMultiUserLoginFailure()}
                    <StatusBar backgroundColor={Styles.blackColor} barStyle="light-content"/>
                    <View style={{
                        padding: 72,
                        paddingTop: 144,
                        flexDirection: 'column',
                        justifyContent: 'flex-start'
                    }}>
                        <Text style={Styles.logoPlaceHolder}>openchs</Text>

                        <Text style={{
                            color: Colors.ValidationError,
                            justifyContent: 'center'
                        }}>{this.errorMessage()}</Text>
                        <View>
                            <TextFormElement element={new StaticFormElement('userId')}
                                             actionName={Actions.ON_USER_ID_CHANGE}
                                             validationResult={this.state.validationResult}
                                             value={new PrimitiveValue(this.state.userId)}
                                             style={{marginTop: Distances.VerticalSpacingBetweenFormElements}}
                                             multiline={false}
                                // autoFocus={true}
                            />
                            <TextFormElement element={new StaticFormElement('password')}
                                             secureTextEntry={!this.state.showPassword}
                                             actionName={Actions.ON_PASSWORD_CHANGE} validationResult={null}
                                             style={{marginTop: Distances.VerticalSpacingBetweenFormElements}}
                                             value={new PrimitiveValue(this.state.password)}
                                             multiline={false}
                            />
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                paddingBottom: 16,
                                alignItems: 'center',
                                paddingTop: 8
                            }}>
                                <TouchableNativeFeedback
                                    onPress={() => this.dispatchAction(Actions.ON_TOGGLE_SHOW_PASSWORD)}>
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <CheckBox onPress={() => this.dispatchAction(Actions.ON_TOGGLE_SHOW_PASSWORD)}
                                                  checked={this.state.showPassword}/>
                                        <Text
                                            style={[Styles.formLabel, {paddingLeft: 8}]}>{this.I18n.t('Show password')}</Text>
                                    </View>
                                </TouchableNativeFeedback>
                                <TouchableNativeFeedback onPress={() => {
                                    this.forgotPassword()
                                }} background={TouchableNativeFeedback.SelectableBackground()}>
                                    <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
                                        <Text style={{
                                            color: Styles.accentColor,
                                            fontSize: 16
                                        }}>{this.I18n.t('Forgot Password')}</Text>
                                    </View>
                                </TouchableNativeFeedback>
                            </View>

                            {this.spinner()}
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16}}>
                            {_.get(this, 'props.params.allowSkipLogin') ?
                                <TouchableNativeFeedback onPress={() => {
                                    this.cancelLogin()
                                }} background={TouchableNativeFeedback.SelectableBackground()}>
                                    <View style={[Styles.basicSecondaryButtonView, {minWidth: 144}]}>
                                        <Text style={{color: Styles.blackColor, fontSize: 16}}>SKIP</Text>
                                    </View>
                                </TouchableNativeFeedback>
                                :
                                <View/>
                            }
                            <TouchableNativeFeedback onPress={this.safeLogin} background={TouchableNativeFeedback.SelectableBackground()}>
                                <View style={[Styles.basicPrimaryButtonView, {marginLeft: 16, minWidth: 144}]}>
                                    <Text style={{color: Styles.whiteColor, fontSize: 16}}>{this.I18n.t('LOGIN')}</Text>
                                </View>
                            </TouchableNativeFeedback>
                        </View>
                    </View>
                </CHSContent>
            </CHSContainer>
        );
    }

    clearDataAndLogin() {
        this.getService(AuthService).clearData()
            .then(()=> this.reset())
            .then(()=> this.justLogin());
    }

    safeLogin() {
        if (!this.state.validationResult.success) {
            return;
        }
        if (this.state.loggedInUser && this.state.loggedInUser !== this.state.userId) {
            this.setState({showMultiUserLoginWarning: true});
            return;
        }
        this.justLogin();
    }

    justLogin() {
        this.dispatchAction(Actions.ON_LOGIN, {
            success: this.loginComplete.bind(this),
            failure: this.loginFailure.bind(this),
            newPasswordRequired: this.newPasswordRequired.bind(this)
        });
    }
}

export default LoginView;
