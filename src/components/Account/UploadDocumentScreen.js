import React, { Component } from 'react';
import { View, Image, TouchableOpacity, Alert } from 'react-native';
import { Item, Text, Form, Label, Content, Container, Icon } from 'native-base';
import UploadDocumentStyle from './UploadDocumentStyle';
import { I18n } from 'react-i18next';
import { Loading, CustomToast } from '../../shared/components';
import { ModalHeader } from '../../shared/components/ModalHeader';
import { ADD_DOCUMENT_ROUTE } from '../../constants/routes';
import accountStore from './AccountStore';
import { uploadDocument, getDocuments } from './actions';
// import DocumentPicker from 'react-native-document-picker';
import { i18next } from '../../i18n';
import { LOG } from '../../shared';
import ImagePicker from 'react-native-image-picker';

const IMAGE_PICKER_OPTIONS = {
  mediaType: 'photo',
  noData: true,
  skipBackup: true,
};

const documentsTypes = [
  {
    id: 0,
    name: i18next.t('USER_DOCUMENTS.docTypeA'),
    value: 'A',
  },
  {
    id: 1,
    name: i18next.t('USER_DOCUMENTS.docTypeB'),
    value: 'B',
  },
  {
    id: 1,
    name: i18next.t('USER_DOCUMENTS.docTypeC'),
    value: 'C',
  },
];
class UploadDocumentScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      true: false,
      showWarning: true,
      isAllowDocuments: true,
      documents: [],
      user: accountStore.getState('Login').user,
      docType: '',
    };
  }

  componentDidMount() {
    this.uploadDocumentSubscription = accountStore.subscribe(
      'UploadDocument',
      (data) => {
        console.log('UploadDocument: ', data);
        this.setState({ isLoading: false });
        getDocuments();
      },
    );
    this.getDocumentsSubscription = accountStore.subscribe(
      'GetDocuments',
      (documents) => {
        this.setState({ documents });
        console.log('GetDocuments: ', documents);
      },
    );
    this.accountStoreError = accountStore.subscribe(
      'AccountStoreError',
      this.errorHandler,
    );
    getDocuments();
  }

  componentWillUnmount() {
    this.getDocumentsSubscription.unsubscribe();
    this.accountStoreError.unsubscribe();
  }

  errorHandler = (err) => {
    this.setState({ isLoading: false });
    CustomToast(err, 'danger');
  };

  goToAddDocument = () => {
    this.props.navigation.navigate(ADD_DOCUMENT_ROUTE);
  };

  // pickDocument = async () => {
  //   // Pick a single file
  //   try {
  //     const res = await DocumentPicker.pick({
  //       type: [DocumentPicker.types.pdf],
  //     });
  //     console.log(res);
  //     console.log(
  //       res.uri,
  //       res.type, // mime type
  //       res.name,
  //       res.size,
  //     );
  //     this.saveDocumentAlert(res.name, res);
  //   } catch (err) {
  //     if (DocumentPicker.isCancel(err)) {
  //       // User cancelled the picker, exit any dialogs or menus and move on
  //     } else {
  //       throw err;
  //     }
  //   }
  // };

  saveDocumentAlert = (docName, res) => {
    Alert.alert(
      i18next.t('USER_DOCUMENTS.wantToAddDocument'),
      ` ${docName}?`,
      [
        {
          text: i18next.t('APP.cancel'),
          onPress: () => {
            LOG(this, 'Cancel add document');
          },
        },
        {
          text: i18next.t('USER_DOCUMENTS.saveDoc'),
          onPress: () => {
            this.setState({ isLoading: true }, () => {
              uploadDocument(res);
            });
          },
        },
      ],
      { cancelable: false },
    );
  };

  deleteDocumentAlert = (docName) => {
    Alert.alert(
      i18next.t('USER_DOCUMENTS.wantToDeleteDocument'),
      ` ${docName}?`,
      [
        {
          text: i18next.t('APP.cancel'),
          onPress: () => {
            LOG(this, 'Cancel delete document');
          },
        },
        {
          text: i18next.t('USER_DOCUMENTS.deleteDoc'),
          onPress: () => {
            // this.setState({ isLoading: true }, () => {
            //   deleteDocument(res);
            // });
          },
        },
      ],
      { cancelable: false },
    );
  };

  pickDocumentTypeAlert = () => {
    const buttons = documentsTypes.map((type) => {
      return {
        text: type.name,
        onPress: () => {
          this.setState({ docType: type.value }, () => {
            this.openImagePicker();
          });
        },
      };
    });
    Alert.alert(
      i18next.t('USER_DOCUMENTS.pickDocType'),
      i18next.t('USER_DOCUMENTS.pickDocInfo'),
      buttons,
      { cancelable: false },
    );
  };

  camelCaseIt = (name) =>
    name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

  openImagePicker = () => {
    ImagePicker.showImagePicker(
      IMAGE_PICKER_OPTIONS,
      this.handleImagePickerResponse,
    );
  };

  /**
   * Handle react-native-image-picker response and set the selected image
   * @param  {object} response A react-native-image-picker response
   * with the uri, type & name
   */
  handleImagePickerResponse = (response) => {
    const { docType } = this.state;
    if (response.didCancel) {
      // for react-native-image-picker response
      LOG(this, 'User cancelled image picker');
    } else if (response.error) {
      // for react-native-image-picker response
      LOG(this, `ImagePicker Error: ${response.error}`);
    } else if (response.customButton) {
      // for react-native-image-picker response
      LOG(this, `User tapped custom button: ${response.customButton}`);
    } else {
      if (!response.uri) return;

      let type = response.type;

      if (type === undefined && response.fileName === undefined) {
        const pos = response.uri.lastIndexOf('.');
        type = response.uri.substring(pos + 1);
        if (type) type = `image/${type}`;
      }
      if (type === undefined) {
        const splitted = response.fileName.split('.');
        type = splitted[splitted.length - 1];
        if (type) type = `image/${type}`;
      }

      let name = response.fileName;
      if (name === undefined && response.fileName === undefined) {
        const pos = response.uri.lastIndexOf('/');
        name = response.uri.substring(pos + 1);
      }

      const selectedImage = {
        uri: response.uri,
        type: type.toLowerCase(),
        name,
        docType,
      };
      this.saveDocumentAlert(selectedImage.name, selectedImage);
      this.setState({ selectedImage });
    }
  };

  render() {
    const { user, isAllowDocuments, showWarning, docType } = this.state;
    const { documents } = this.state;
    console.log('user: ', user);
    console.log('docType: ', docType);
    return (
      <I18n>
        {(t) => (
          <Container>
            <ModalHeader
              screenName={t('USER_DOCUMENTS.myDocuments')}
              title={t('USER_DOCUMENTS.myDocuments')}
            />
            {showWarning ? (
              <View
                style={
                  isAllowDocuments
                    ? UploadDocumentStyle.userStatusLabelApproved
                    : UploadDocumentStyle.userStatusLabelRejected
                }>
                <Text
                  style={
                    isAllowDocuments
                      ? UploadDocumentStyle.userStatusLabelTextApproved
                      : UploadDocumentStyle.userStatusLabelTextRejected
                  }>
                  {`${user.first_name} ${
                    isAllowDocuments
                      ? t('USER_DOCUMENTS.allowDocuments')
                      : t('USER_DOCUMENTS.notAllowDocuments')
                  }`}
                </Text>
                {isAllowDocuments ? (
                  <Icon
                    onPress={() => this.setState({ showWarning: false })}
                    style={UploadDocumentStyle.closeIconApproved}
                    name="close"
                    size={5}
                  />
                ) : null}
              </View>
            ) : null}
            {this.state.isLoading ? <Loading /> : null}
            <Content>
              <View style={UploadDocumentStyle.container}>
                <View style={{ height: '100%' }}>
                  {documents.length > 0 ? (
                    documents.map((doc, i) => (
                      <Form key={i}>
                        <View style={UploadDocumentStyle.formStyle}>
                          <Item
                            style={UploadDocumentStyle.viewInput}
                            inlineLabel
                            rounded>
                            <View
                              style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                              }}>
                              <Label numberOfLines={1} style={{ width: 180 }}>
                                {doc.name || `document #${doc.id}`}
                              </Label>
                              <Label style={UploadDocumentStyle.statusStyle}>
                                {doc.state
                                  ? this.camelCaseIt(doc.state)
                                  : 'Pending'}
                              </Label>
                            </View>
                            {doc.rejected_reason ? (
                              <View>
                                <Label
                                  numberOfLines={1}
                                  style={
                                    UploadDocumentStyle.documentRejectedText
                                  }>
                                  {`${t('USER_DOCUMENTS.rejectedReason')} ${
                                    doc.rejected_reason
                                  }`}
                                </Label>
                              </View>
                            ) : null}
                          </Item>
                          <TouchableOpacity
                            onPress={() =>
                              this.deleteDocumentAlert(
                                doc.name || `document #${doc.id}`,
                              )
                            }>
                            <Image
                              style={UploadDocumentStyle.garbageIcon}
                              source={require('../../assets/image/delete.png')}
                            />
                          </TouchableOpacity>
                        </View>
                      </Form>
                    ))
                  ) : (
                    <Text style={UploadDocumentStyle.noDocsText}>
                      {t('USER_DOCUMENTS.noDocuments')}
                    </Text>
                  )}
                </View>
              </View>
            </Content>
            <View style={UploadDocumentStyle.buttonContainer}>
              <TouchableOpacity onPress={() => this.pickDocumentTypeAlert()}>
                <View full style={UploadDocumentStyle.viewButtomLogin}>
                  <Text style={UploadDocumentStyle.textButtom}>
                    {t('USER_DOCUMENTS.addDocument')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </Container>
        )}
      </I18n>
    );
  }
}

export default UploadDocumentScreen;
