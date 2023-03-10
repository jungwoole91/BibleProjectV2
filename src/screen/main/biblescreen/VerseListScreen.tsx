import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Clipboard,
} from 'react-native';

import Toast from 'react-native-easy-toast';
import {
  getBibleVerseItems,
  getItemFromAsync,
  printIsNewOrOldBibleByBookCode,
  setItemToAsync,
} from '../../../utils';
import CommandModal from '../../../components/verselist/CommandModal';
import BibleListOption from './components/biblelistOption/BibleListOption';
import BibleNoteOption from './components/BibleNoteOption';
import FontChangeOption from './components/FontChangeOption';
import {StackActions} from '@react-navigation/native';
import MemoModal from '../../../components/verselist/MemoModal';
import VerseFlatList from '../../../components/verselist/VerseFlatList/VerseFlatList';
import LoadingSpinner from '../../components/LoadingSpinner';

const VerseListScreen = ({navigation, route}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [verseItems, setVerseItems] = useState([]);
  const [commandModalVisible, setCommandModalVisible] = useState(false);
  const [memoModalVisible, setMemoModalVisible] = useState(false);
  const [bibleListOptionIconUri, setBibleListOptionIconUri] = useState(
    require('../../../assets/ic_option_list_off.png'),
  );
  const [bibleNoteOptionIconUri, setBibleNoteOptionIconUri] = useState(
    require('../../../assets/ic_option_note_off.png'),
  );
  const [fontChangeOptionIconUri, setFontChangeOptionIconUri] = useState(
    require('../../../assets/ic_option_font_off.png'),
  );
  const [optionComponentState, setOptionComponentState] = useState('');
  const [bibleType, setBibleType] = useState(0);
  const [modalBibleItem, setModalBibleItem] = useState({});
  const [verseItemFontSize, setVerseItemFontSize] = useState(14);
  const [verseItemFontFamily, setVerseItemFontFamily] = useState('system font');
  const toastRef = useRef(null);
  const saveLatestBibleVerse = useCallback(
    async (bookName, bookCode, chapterCode) => {
      const bibleName = printIsNewOrOldBibleByBookCode(bookCode);
      const readItem = {
        bibleName,
        bookName,
        bookCode,
        chapterCode,
      };
      await setItemToAsync('latelyReadList', readItem);
    },
    [],
  );

  const setFontSizeFromStorage = useCallback(async () => {
    const fontSizeOption = await getItemFromAsync('fontSizeOption');
    switch (fontSizeOption) {
      case null: {
        setVerseItemFontSize(14);
        break;
      }

      case 0: {
        setVerseItemFontSize(12);
        break;
      }

      case 1: {
        setVerseItemFontSize(14);
        break;
      }

      case 2: {
        setVerseItemFontSize(16);
        break;
      }

      case 3: {
        setVerseItemFontSize(18);
        break;
      }
    }
  }, [verseItemFontSize]);

  const setFontFamilyFromStorage = useCallback(async () => {
    const fontFamilyOption = await getItemFromAsync('fontFamilyOption');
    switch (fontFamilyOption) {
      case null: {
        setVerseItemFontFamily('system font');
        break;
      }

      case 0: {
        setVerseItemFontFamily('system font');
        break;
      }

      case 1: {
        setVerseItemFontFamily('NanumBrush');
        break;
      }

      case 2: {
        setVerseItemFontFamily('TmonMonsoriBlack');
        break;
      }

      case 3: {
        setVerseItemFontFamily('KoreanGIR-L');
        break;
      }
    }
  }, [verseItemFontFamily]);

  const getUpdatedHighlightVerseItems = useCallback(
    async items => {
      let highlightsItems = await getItemFromAsync('highlightList');
      highlightsItems = highlightsItems ? highlightsItems : [];

      items.forEach(verse => {
        const index = highlightsItems.findIndex(highlightItem => {
          return (
            highlightItem.bookCode === verse.bookCode &&
            highlightItem.chapterCode === verse.chapterCode &&
            highlightItem.verseCode === verse.verseCode
          );
        });
        if (index > -1) {
          verse.isHighlight = true;
        } else {
          verse.isHighlight = false;
        }
      });

      return items;
    },
    [verseItems],
  );

  const getUpdatedMemoVerseItems = useCallback(
    async items => {
      let memoListItems = await getItemFromAsync('memoList');
      if (memoListItems === null) memoListItems = [];
      items.forEach(verse => {
        const index = memoListItems.findIndex(memoItem => {
          return (
            memoItem.bookCode === verse.bookCode &&
            memoItem.chapterCode === verse.chapterCode &&
            memoItem.verseCode === verse.verseCode
          );
        });
        if (index > -1) {
          verse.isMemo = true;
        } else {
          verse.isMemo = false;
        }
      });

      return items;
    },
    [verseItems],
  );

  const updateVerseItems = useCallback(async () => {
    /** 1. ?????? ?????? ?????? ?????? ?????? **/
    const {bookName, bookCode, chapterCode} = route.params;
    await saveLatestBibleVerse(bookName, bookCode, chapterCode);

    /** 2. ?????? ??????????????? ????????? ?????? ???????????? ?????? ???????????? ?????????. **/
    await setFontSizeFromStorage();

    /** 3. ????????? ?????? ?????????????????? ????????? ?????? ???????????? ?????? ????????? ?????? **/
    await setFontFamilyFromStorage();

    let verseItems = await getBibleVerseItems(bookName, bookCode, chapterCode);
    /** 4. VerseItem??? ???????????? ??????????????? ?????? **/
    verseItems = await getUpdatedHighlightVerseItems(verseItems);

    /** 5. VerseItem??? ???????????? memo ?????? **/
    verseItems = await getUpdatedMemoVerseItems(verseItems);

    setVerseItems(verseItems);
    setBibleType(bibleType);
    setIsLoading(false);
  }, [verseItems, verseItemFontSize, verseItemFontFamily]);

  useEffect(() => {
    updateVerseItems().then();
  }, []);

  /** ??? setModalVisible **/
  const actionCommandModal = useCallback(
    async modalAction => {
      const {bookCode, chapterCode, verseCode, content, isHighlight} =
        modalBibleItem;
      switch (modalAction) {
        case 'copy': {
          Clipboard.setString(content);
          toastRef.current.show('??????????????? ?????????????????????.');
          break;
        }
        case 'highlight': {
          /** ??????????????? => ??????????????? ?????? **/
          if (isHighlight) {
            let highlightItems = await getItemFromAsync('highlightList');
            if (highlightItems === null) highlightItems = [];
            const index = highlightItems.findIndex((item, index) => {
              return (
                item.bookCode === bookCode &&
                item.chapterCode === chapterCode &&
                item.verseCode === verseCode
              );
            });
            highlightItems.splice(index, 1);
            await setItemToAsync('highlightList', highlightItems);
            toastRef.current.show('????????? ?????? ?????? ^^');
          } else {
            /** ??????????????? **/
            let highlightItems = await getItemFromAsync('highlightList');

            if (highlightItems === null) {
              highlightItems = [];
            }
            highlightItems.push({bookCode, chapterCode, verseCode});
            console.log(highlightItems);

            await setItemToAsync('highlightList', highlightItems);
            toastRef.current.show('??????????????? ?????? ^^');
          }
          updateVerseItems().then();

          break;
        }
        case 'memo': {
          // ?????? ?????? ??????
          setMemoModalVisible(true);
          break;
        }
      }
    },
    [modalBibleItem],
  );

  /** ?????? 3?????? ?????? ????????? ?????? ?????? ?????? ?????? **/
  const openBibleListOptionModal = useCallback(() => {
    setCommandModalVisible(false);
    setOptionComponentState('bibleList');
    setBibleListOptionIconUri(require('../../../assets/ic_option_list_on.png'));
    setBibleNoteOptionIconUri(
      require('../../../assets/ic_option_note_off.png'),
    );
    setFontChangeOptionIconUri(
      require('../../../assets/ic_option_font_off.png'),
    );
  }, [commandModalVisible, optionComponentState]);

  /** ?????? 3?????? ?????? ????????? ?????? ?????? ?????? **/
  const openBibleNoteOptionModal = useCallback(() => {
    setCommandModalVisible(false);
    setOptionComponentState('bibleNote');
    setBibleListOptionIconUri(
      require('../../../assets/ic_option_list_off.png'),
    );
    setBibleNoteOptionIconUri(require('../../../assets/ic_option_note_on.png'));
    setFontChangeOptionIconUri(
      require('../../../assets/ic_option_font_off.png'),
    );
  }, [commandModalVisible, optionComponentState]);

  /** ?????? 3?????? ?????? ????????? ?????? ?????? **/
  const openFontChangeOptionModal = useCallback(() => {
    setCommandModalVisible(false);
    setOptionComponentState('fontChange');
    setBibleListOptionIconUri(
      require('../../../assets/ic_option_list_off.png'),
    );
    setBibleNoteOptionIconUri(
      require('../../../assets/ic_option_note_off.png'),
    );
    setFontChangeOptionIconUri(
      require('../../../assets/ic_option_font_on.png'),
    );
  }, [commandModalVisible, optionComponentState]);

  // closeFooterOption (old)
  /** ?????? 3?????? ?????? ?????? ?????? ?????? **/
  const closeAllOptionModal = useCallback(() => {
    setOptionComponentState('default');
    setBibleListOptionIconUri(
      require('../../../assets/ic_option_list_off.png'),
    );
    setBibleNoteOptionIconUri(
      require('../../../assets/ic_option_note_off.png'),
    );
    setFontChangeOptionIconUri(
      require('../../../assets/ic_option_font_off.png'),
    );
    // this.componentDidMount()
  });

  const changeScreenNavigation =
    (bookName, bookCode, chapterCode, verseCode) => () => {
      const popAction = StackActions.pop(2);
      navigation.dispatch(popAction);

      const pushChapterList = StackActions.push('ChapterListScreen', {
        bookCode,
        bookName,
      });
      navigation.dispatch(pushChapterList);

      const pushVerseList = StackActions.push('VerseListScreen', {
        bookCode,
        bookName,
        chapterCode,
      });
      navigation.dispatch(pushVerseList);
    };

  // ????????? ???????????? ?????? ???????????? ?????? ????????? ???????????? ?????????.
  // ??????, ?????????, ?????? ????????? ?????? ?????? ?????? ???????????????.
  const onLongPressButton = useCallback(
    verseItem => {
      setModalBibleItem(verseItem);
      setCommandModalVisible(true);
    },
    [verseItems],
  );

  if (isLoading) {
    return <LoadingSpinner />;
  } else {
    return (
      <View style={styles.container}>
        <CommandModal
          modalBibleItem={modalBibleItem}
          setCommandModalVisible={setCommandModalVisible}
          commandModalVisible={commandModalVisible}
          actionCommandModal={actionCommandModal}
          openBibleNoteOptionModal={openBibleNoteOptionModal}
        />

        <MemoModal
          modalBibleItem={modalBibleItem}
          memoModalVisible={memoModalVisible}
          setMemoModalVisible={setMemoModalVisible}
          updateVerseItems={updateVerseItems}
          toastRef={toastRef}
        />

        <VerseFlatList
          navigation={navigation}
          verseItems={verseItems}
          verseItemFontSize={verseItemFontSize}
          verseItemFontFamily={verseItemFontFamily}
          onLongPressButton={onLongPressButton}
        />

        {/* ?????? ??????, ????????????, ??????????????? ?????? footer option */}
        <View
          keyboardVerticalOffset={10}
          contentContainerStyle={{borderColor: 'red'}}
          style={styles.footerOptionContainer}>
          <TouchableOpacity
            style={styles.footerOptionContainerItem}
            onPress={openBibleListOptionModal}>
            <Image
              style={styles.footerOptionIcon}
              source={bibleListOptionIconUri}
            />
            <Text>??????</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.footerOptionContainerItem}
            onPress={openBibleNoteOptionModal}>
            <Image
              style={styles.footerOptionIcon}
              source={bibleNoteOptionIconUri}
            />
            <Text>????????????</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.footerOptionContainerItem}
            onPress={openFontChangeOptionModal}>
            <Image
              style={styles.footerOptionIcon}
              source={fontChangeOptionIconUri}
            />
            <Text>????????????</Text>
          </TouchableOpacity>
        </View>

        {optionComponentState === 'bibleList' && (
          <BibleListOption
            changeScreenHandler={changeScreenNavigation}
            bibleType={bibleType}
            closeHandler={closeAllOptionModal}
          />
        )}
        {optionComponentState === 'bibleNote' && (
          <BibleNoteOption
            toastRef={toastRef}
            closeHandler={closeAllOptionModal}
            updateVerseItems={updateVerseItems}
          />
        )}
        {optionComponentState === 'fontChange' && (
          <FontChangeOption
            changeFontSizeHandler={setVerseItemFontSize}
            changeFontFamilyHandler={setVerseItemFontFamily}
            closeHandler={closeAllOptionModal}
          />
        )}

        <Toast
          ref={toastRef}
          positionValue={130}
          fadeInDuration={200}
          fadeOutDuration={1000}
        />
      </View>
    );
  }
};

export default VerseListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 15,
    paddingBottom: 15,
    backgroundColor: 'white',
  },

  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  flatList: {
    flexDirection: 'column',
  },

  flatListVerseItem: {
    paddingTop: 15,
    paddingBottom: 15,
    flexDirection: 'row',
  },

  flatListItemTextLabel: {
    width: '7%',
    textAlign: 'center',
  },

  flatListItemText: {
    width: '86%',
    color: 'black',
    marginRight: '3%',
    paddingRight: 5,
    marginLeft: 5,
  },

  flatListItemTextHighlight: {
    width: '86%',
    color: 'black',
    marginRight: '3%',
    paddingRight: 5,
    marginLeft: 5,
    textShadowColor: 'yellow',
    textShadowRadius: 15,
  },

  memoIndicator: {
    width: '4%',
    height: 19,
    resizeMode: 'contain',
    borderColor: 'red',
  },

  /* ?????? ??? */
  modal: {
    borderWidth: 1,
    borderColor: 'red',
  },

  modalContainer: {
    // backgroundColor: 'rgba(0,0,0,0.5)',
    width: '100%',
    height: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalView: {
    width: 250,
    height: 200,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: 'white',
    flexDirection: 'column',
    alignItems: 'center',
  },

  modalHeader: {
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 10,
  },

  modalViewItems: {
    width: '90%',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 25,
  },

  modalItemText: {
    color: 'black',
    fontSize: 15,
    textAlign: 'center',
  },

  modalItemImage: {
    width: 40,
    height: 30,
    resizeMode: 'contain',
  },

  modalCancel: {
    width: '100%',
    height: 50,
    marginTop: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F4',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },

  /* ?????? ?????? ??? */

  memoModalContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: '100%',
    height: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  memoModalView: {
    width: '80%',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: 'white',
    flexDirection: 'column',
    alignItems: 'center',
  },

  memoModalHeader: {
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
  },

  memoModalHeaderSave: {},

  memoModalHeaderSaveText: {
    fontSize: 16,
    color: '#E0E0E0',
  },

  memoModalHeaderSaveTextActive: {
    fontSize: 16,
    color: '#2F80ED',
  },

  memoModalHeaderText: {
    fontSize: 17,
    fontWeight: 'bold',
    marginRight: 1,
  },

  memoModalHeaderCancel: {},

  memoModalHeaderCancelText: {
    fontSize: 20,
  },

  memoModalHeaderCancelImage: {
    width: 25,
    height: 25,
  },

  memoModalBible: {
    width: '100%',
    backgroundColor: '#F3F4F9',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    justifyContent: 'space-evenly',
    flexDirection: 'column',
  },

  memoModalBibleVerse: {
    marginTop: '5%',
    marginLeft: '5%',
    marginRight: '5%',
    fontWeight: 'bold',
  },

  memoModalBibleContent: {
    marginTop: '5%',
    marginLeft: '5%',
    marginRight: '5%',
    marginBottom: '5%',
  },

  memoModalTextInput: {
    width: '100%',
    height: 100,
    textAlignVertical: 'top',
    padding: '5%',
  },

  /* ?????? ?????? */
  footerOptionContainer: {
    borderWidth: 1,
    position: 'absolute',
    left: '2.5%',
    bottom: '5%',
    width: '95%',
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 5,
    backgroundColor: 'white',
    justifyContent: 'space-around',
    flexDirection: 'row',
  },

  footerOptionContainerItem: {
    width: '30%',
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },

  footerOptionIcon: {
    width: 40,
    height: 30,
    resizeMode: 'contain',
  },

  /* ?????? ?????? ?????? */
  moveChapter: {
    paddingBottom: 100,
    marginTop: 20,
    width: '90%',
    justifyContent: 'space-evenly',
    flexDirection: 'row',
    marginLeft: 'auto',
    marginRight: 'auto',
  },

  moveChapterBtn: {
    width: 130,
    height: 60,
    backgroundColor: '#F9DA4F',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },

  moveChapterText: {
    fontWeight: 'bold',
  },
});
