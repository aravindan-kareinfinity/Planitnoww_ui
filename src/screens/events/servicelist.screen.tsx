import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {
  CompositeScreenProps,
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {useAppDispatch, useAppSelector} from '../../redux/hooks.redux';
import {counteractions, selectcounter} from '../../redux/counter.redux';
import {AppButton} from '../../components/appbutton.component';
import {$} from '../../styles';
import {AppTextInput} from '../../components/apptextinput.component';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {AppSwitch} from '../../components/appswitch.component';
import {FlatList, Image, ScrollView, TouchableOpacity} from 'react-native';
import {Line} from 'react-native-svg';
import {AppAlert} from '../../components/appalert.component';
import {AppSingleSelect} from '../../components/appsingleselect.component';
import {FilesService} from '../../services/files.service';
import {OrganisationService} from '../../services/organisation.service';
import {
  OrganisationDetail,
  OrganisationSelectReq,
} from '../../models/organisation.model';
import {selectusercontext} from '../../redux/usercontext.redux';
import {
  ReferenceType,
  ReferenceTypeSelectReq,
} from '../../models/referencetype.model';
import {
  ReferenceValue,
  ReferenceValueSelectReq,
} from '../../models/referencevalue.model';
import {ReferenceValueService} from '../../services/referencevalue.service';
import {REFERENCETYPE} from '../../models/users.model';
import {BottomSheetComponent} from '../../components/bottomsheet.component';

type ServiceScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'Service'>,
  NativeStackScreenProps<AppStackParamList>
>;
export function ServiceScreen() {
  const navigation = useNavigation<ServiceScreenProp['navigation']>();
  const [isloading, setIsloading] = useState(false);
  const Organizationlist = useMemo(() => new OrganisationService(), []);
  const [OrganisatonDetailList, setOrganisationDetailList] = useState<OrganisationDetail[]>([]);
  const [filteredOrganisations, setFilteredOrganisations] = useState<OrganisationDetail[]>([]);
  const usercontext = useAppSelector(selectusercontext);

  // State for filters
  const [selectedPrimaryType, setSelectedPrimaryType] = useState<number | null>(null);
  const [selectedSecondaryType, setSelectedSecondaryType] = useState<number | null>(null);
  const [primaryBusinessTypes, setPrimaryBusinessTypes] = useState<ReferenceType[]>([]);
  const [secondaryBusinessTypes, setSecondaryBusinessTypes] = useState<ReferenceValue[]>([]);
  
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const PrimarybottomSheetRef = useRef<any>(null);
  const SecondarybottomSheetRef = useRef<any>(null);

  // Fetch initial data
  const getInitialData = async () => {
    try {
      setIsloading(true);
      const req = new OrganisationSelectReq();
      const res = await Organizationlist.SelectOrganisationDetail(req);
      if (res) {
        setOrganisationDetailList(res);
        setFilteredOrganisations(res); // Initialize filtered list with all data
      }
    } catch (error) {
      AppAlert({message: 'Failed to load organisations'});
    } finally {
      setIsloading(false);
    }
  };

  // Apply filters based on selected types
  const applyFilters = useCallback(() => {
    let filtered = [...OrganisatonDetailList];

    if (selectedPrimaryType) {
      filtered = filtered.filter(
        org => org.organisationprimarytype === selectedPrimaryType
      );
    }

    if (selectedSecondaryType) {
      filtered = filtered.filter(
        org => org.organisationsecondarytype === selectedSecondaryType
      );
    }

    setFilteredOrganisations(filtered);
  }, [OrganisatonDetailList, selectedPrimaryType, selectedSecondaryType]);

  // Fetch reference types
  const fetchReferenceTypes = async () => {
    try {
      const req = new ReferenceTypeSelectReq();
      req.referencetypeid = REFERENCETYPE.ORGANISATIONPRIMARYTYPE;
      const response = await referenceValueService.select(req);
      if (response) {
        setPrimaryBusinessTypes(response);
      }
    } catch (error) {
      AppAlert({message: 'Failed to load business types'});
    }
  };

  // Fetch secondary types when primary is selected
  const fetchSecondaryTypes = async (primaryId: number) => {
    try {
      const req = new ReferenceValueSelectReq();
      req.parentid = primaryId;
      req.referencetypeid = REFERENCETYPE.ORGANISATIONSECONDARYTYPE;
      const response = await referenceValueService.select(req);
      if (response) {
        setSecondaryBusinessTypes(response);
        SecondarybottomSheetRef.current?.open();
      }
    } catch (error) {
      AppAlert({message: 'Failed to load secondary types'});
    }
  };

  // Handle primary type selection
  const handlePrimaryTypeSelect = (item: ReferenceType) => {
    setSelectedPrimaryType(item.id);
    setSelectedSecondaryType(null); // Reset secondary when primary changes
    fetchSecondaryTypes(item.id);
  };

  // Handle secondary type selection
  const handleSecondaryTypeSelect = (item: ReferenceValue) => {
    setSelectedSecondaryType(item.id);
    SecondarybottomSheetRef.current?.close();
    applyFilters();
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedPrimaryType(null);
    setSelectedSecondaryType(null);
    setFilteredOrganisations(OrganisatonDetailList);
  };

  useFocusEffect(
    useCallback(() => {
      getInitialData();
      fetchReferenceTypes();
    }, [])
  );

  // Re-apply filters when selections change
  useEffect(() => {
    applyFilters();
  }, [selectedPrimaryType, selectedSecondaryType, applyFilters]);

  return (
    <AppView style={[$.bg_tint_11]}>
      {/* Keep your existing UI exactly as is, just change the data source */}
      <AppView style={[$.flex_row, $.align_items_center, $.p_small]}>
        <AppText style={[$.fs_medium, $.fw_regular, $.flex_1, $.text_primary5]}>
          Services
        </AppText>

        <TouchableOpacity
          onPress={() => {
            PrimarybottomSheetRef.current.open();
          }}>
          <CustomIcon
            color={$.tint_primary_5}
            name={CustomIcons.Filter}
            size={$.s_medium}
          />
        </TouchableOpacity>
      </AppView>

      {/* Change data={OrganisatonDetailList} to data={filteredOrganisations} */}
      <FlatList
        data={filteredOrganisations}
        nestedScrollEnabled={true}
        contentContainerStyle={{paddingBottom: 100}}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item, index}) => (
          <AppView
            style={[$.m_small, $.elevation_4, $.p_medium, $.border_rounded]}>
            <AppText style={[$.fw_medium, $.fs_big, $.text_primary5]}>
              {item.organisationname}
            </AppText>

            <AppText
              style={[
                $.text_tint_ash,
                $.fs_small,
                $.align_items_center,
                $.mb_small,
                $.flex_1,
                $.text_primary5,
              ]}>
              {item.organisationlocationname},{' '}
              {item.organisationlocationaddressline1},{' '}
              {item.organisationlocationcity}, {item.organisationlocationstate},{' '}
              {item.organisationlocationpincode}
            </AppText>

            <AppView
              style={[
                $.flex_1,
                $.flex_row,
                $.align_items_center,
                $.flex_wrap_wrap,
                $.m_tiny,
              ]}>
              <AppView
                style={[
                  $.border_rounded2,
                  $.bg_tint_9,
                  $.p_tiny,
                  $.px_small,
                  $.m_tiny,
                ]}>
                <AppText
                  style={[$.fw_regular, $.fs_small, $.text_tint_5, $.p_tiny]}>
                  {item.organisationprimarytypecode}{' '}
                </AppText>
              </AppView>

              <AppView
                style={[
                  $.border_rounded2,
                  $.bg_tint_10,
                  $.p_tiny,
                  $.px_small,
                  $.m_tiny,
                ]}>
                <AppText
                  style={[$.fw_regular, $.fs_small, $.text_tint_1, $.p_tiny]}>
                  {item.organisationsecondarytypecode}{' '}
                </AppText>
              </AppView>
            </AppView>

            <AppButton
              style={[$.bg_tint_3, $.border_rounded2, $.mt_small]}
              name={'Schedule Appointment'}
              onPress={() => {
                navigation.navigate('AppoinmentFixing', {
                  organisationid: item.organisationid,
                  organisationlocationid: item.organisationlocationid,
                });
              }}></AppButton>
          </AppView>
        )}
      />

      {/* Keep your existing BottomSheetComponents exactly as is, just update the onPress handlers */}
      <BottomSheetComponent
        ref={PrimarybottomSheetRef}
        screenname={'Primary Business Type'}
        Save={() => {}}
        showbutton={false}
        close={() => PrimarybottomSheetRef.current?.close()}>
        <AppView style={[$.pb_medium]}>
          <FlatList
            data={primaryBusinessTypes}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={[
              $.py_small,
              $.flex_1,
              {flexWrap: 'wrap'},
            ]}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item, index}) => (
              <TouchableOpacity
                onPress={() => {
                  handlePrimaryTypeSelect(item);
                  PrimarybottomSheetRef.current.close();
                }}
                style={[
                  $.border,
                  $.border_rounded2,
                  $.mr_small,
                  $.mb_small,
                  $.px_small,
                  $.py_small,
                  {
                    backgroundColor: '#f8f9fa',
                    borderColor: '#dee2e6',
                    minWidth: 120,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}>
                <AppText
                  style={[
                    $.text_center,
                    $.fs_small,
                    $.fw_regular,
                    {color: '#212529'},
                  ]}>
                  {item.displaytext}
                </AppText>
              </TouchableOpacity>
            )}
          />
        </AppView>
      </BottomSheetComponent>

      <BottomSheetComponent
        ref={SecondarybottomSheetRef}
        screenname={'Secondary Business Type'}
        Save={() => {}}
        showbutton={false}
        close={() => SecondarybottomSheetRef.current?.close()}>
        <AppView style={[$.pb_medium]}>
          <FlatList
            data={secondaryBusinessTypes}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={[
              $.py_small,
              $.flex_1,
              {flexWrap: 'wrap'},
            ]}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item, index}) => (
              <TouchableOpacity
                onPress={() => {
                  handleSecondaryTypeSelect(item);
                  SecondarybottomSheetRef.current?.close();
                  PrimarybottomSheetRef.current.close();
                }}
                style={[
                  $.border,
                  $.border_rounded2,
                  $.mr_small,
                  $.mb_small,
                  $.px_small,
                  $.py_small,
                  {
                    backgroundColor: '#f8f9fa',
                    borderColor: '#dee2e6',
                    minWidth: 120,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                ]}>
                <AppText
                  style={[
                    $.text_center,
                    $.fs_small,
                    $.fw_regular,
                    {color: '#212529'},
                  ]}>
                  {item.displaytext}
                </AppText>
              </TouchableOpacity>
            )}
          />
        </AppView>
      </BottomSheetComponent>
    </AppView>
  );
}
