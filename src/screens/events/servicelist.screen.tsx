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
import {
  FlatList,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  View,
} from 'react-native';
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
import {OrganisationLocationService} from '../../services/organisationlocation.service';
import {
  OrgLocationReq,
  OrgLocationStaffResponse,
  Service,
  Timing,
} from '../../models/organisationlocation.model';

type ServiceScreenProp = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'Service'>,
  NativeStackScreenProps<AppStackParamList>
>;
export function ServiceScreen() {
  const navigation = useNavigation<ServiceScreenProp['navigation']>();
  const [isloading, setIsloading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const Organizationlist = useMemo(() => new OrganisationService(), []);
  const organisationlocationservice = useMemo(
    () => new OrganisationLocationService(),
    [],
  );
  const [OrganisatonDetailList, setOrganisationDetailList] = useState<
    OrganisationDetail[]
  >([]);
  const [filteredOrganisations, setFilteredOrganisations] = useState<
    OrganisationDetail[]
  >([]);
  const usercontext = useAppSelector(selectusercontext);

  // State for filters
  const [selectedPrimaryType, setSelectedPrimaryType] = useState<number | null>(
    null,
  );
  const [selectedSecondaryType, setSelectedSecondaryType] = useState<
    number | null
  >(null);
  const [primaryBusinessTypes, setPrimaryBusinessTypes] = useState<
    ReferenceType[]
  >([]);
  const [secondaryBusinessTypes, setSecondaryBusinessTypes] = useState<
    ReferenceValue[]
  >([]);

  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const PrimarybottomSheetRef = useRef<any>(null);
  const SecondarybottomSheetRef = useRef<any>(null);
  const getLocationDetailbottomSheetRef = useRef<any>(null);
  const [showBusinessDetails, setShowBusinessDetails] = useState(false);

  // Fetch initial data
  const getInitialData = async () => {
    try {
      setIsloading(true);
      setIsRefreshing(true);
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
      setIsRefreshing(false);
    }
  };

  const [organisationdetail, Setorganisationdetail] =
    useState<OrgLocationStaffResponse>(new OrgLocationStaffResponse());

  const getLocationDetail = async (id: number) => {
    try {
      setIsloading(true);
      const req = new OrgLocationReq();
      req.orglocid = id;
      const res = await organisationlocationservice.SelectlocationDetail(req);

      if (res && res.length > 0) {
        const locationDetail = new OrgLocationStaffResponse();
        const responseData = res[0];

        // Map properties with exact case matching
        locationDetail.BusinessName = responseData.BusinessName || '';
        locationDetail.StreetName = responseData.StreetName || '';
        locationDetail.Area = responseData.Area || '';
        locationDetail.City = responseData.City || '';
        locationDetail.State = responseData.State || '';
        locationDetail.PostalCode = responseData.PostalCode || '';

        // Map Services
        locationDetail.Services =
          responseData.Services?.map(service => {
            const s = new Service();
            s.ServiceName = service.ServiceName || '';
            s.Price = service.Price || 0;
            s.OfferPrice = service.OfferPrice || 0;
            s.Duration = service.Duration || 0;
            return s;
          }) || [];

        // Map Timings
        locationDetail.Timings =
          responseData.Timings?.map(timing => {
            const t = new Timing();
            t.Day = timing.Day || 0;
            t.StartTime =
              typeof timing.StartTime === 'string'
                ? timing.StartTime
                : String(timing.StartTime) || '';
            t.EndTime =
              typeof timing.EndTime === 'string'
                ? timing.EndTime
                : timing.EndTime
                ? String(timing.EndTime)
                : '';
            return t;
          }) || [];

        Setorganisationdetail(locationDetail);
        setShowBusinessDetails(true);
      }
    } catch (error) {
      console.error('Error loading location details:', error);
      AppAlert({message: 'Failed to load location details'});
    } finally {
      setIsloading(false);
    }
  };

  // Helper functions (add these outside your component)
  const getDayName = (dayNumber: number): string => {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[dayNumber] || `Day ${dayNumber}`;
  };

  const formatTime = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hourNum = parseInt(hours, 10);
      const period = hourNum >= 12 ? 'PM' : 'AM';
      const displayHour = hourNum % 12 || 12;
      return `${displayHour}:${minutes} ${period}`;
    } catch (e) {
      return timeString; // fallback to original if parsing fails
    }
  };

  // Apply filters based on selected types
  const applyFilters = useCallback(() => {
    let filtered = [...OrganisatonDetailList];

    if (selectedPrimaryType) {
      filtered = filtered.filter(
        org => org.organisationprimarytype === selectedPrimaryType,
      );
    }

    if (selectedSecondaryType) {
      filtered = filtered.filter(
        org => org.organisationsecondarytype === selectedSecondaryType,
      );
    }

    setFilteredOrganisations(filtered);
  }, [OrganisatonDetailList, selectedPrimaryType, selectedSecondaryType]);

  // Fetch reference types
  const fetchReferenceTypes = async () => {
    try {
      setIsloading(true);
      const req = new ReferenceTypeSelectReq();
      req.referencetypeid = REFERENCETYPE.ORGANISATIONPRIMARYTYPE;
      const response = await referenceValueService.select(req);
      if (response) {
        setPrimaryBusinessTypes(response);
      }
    } catch (error) {
      AppAlert({message: 'Failed to load business types'});
    } finally {
      setIsloading(false);
    }
  };

  // Fetch secondary types when primary is selected
  const fetchSecondaryTypes = async (primaryId: number) => {
    try {
      setIsloading(true);
      const req = new ReferenceValueSelectReq();
      req.parentid = primaryId;
      req.referencetypeid = REFERENCETYPE.ORGANISATIONSECONDARYTYPE;
      console.log("req",req);
      
      const response = await referenceValueService.select(req);
      if (response) {
        console.log("response",response);
        setSecondaryBusinessTypes(response);
        SecondarybottomSheetRef.current?.open();
      }
    } catch (error) {
      AppAlert({message: 'Failed to load secondary types'});
    } finally {
      setIsloading(false);
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
    }, []),
  );

  // Re-apply filters when selections change
  useEffect(() => {
    applyFilters();
  }, [selectedPrimaryType, selectedSecondaryType, applyFilters]);

  return (
    <AppView style={[$.bg_tint_11, $.flex_1]}>
      {/* Header with filter button */}
      <AppView style={[$.flex_row, $.align_items_center, $.p_normal, { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' }]}>
        <AppText
          style={[
            $.fs_medium,
            $.fw_semibold,
            $.text_primary2,
            $.flex_1,
          ]}>
          Services
        </AppText>

        <TouchableOpacity
          onPress={() => {
            PrimarybottomSheetRef.current.open();
          }}
          style={[
            $.flex_row,
            $.align_items_center,
            $.border,
            $.border_rounded,
            $.px_small,
            $.py_tiny,
            $.border_tint_7,
            { 
              backgroundColor: 'white',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2
            }
          ]}>
          <CustomIcon
            color={$.tint_primary_5}
            name={CustomIcons.Filter}
            size={$.s_small}
          />
          <AppText style={[$.ml_tiny, $.fs_small, $.text_primary5]}>
            Filter
          </AppText>
        </TouchableOpacity>
      </AppView>

      {/* Loading indicator when initial data is loading */}
      {isloading && !isRefreshing ? (
        <AppView
          style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
          <ActivityIndicator size="large" color={$.tint_3} />
          <AppText style={[$.mt_medium, $.text_primary5]}>
            Loading services...
          </AppText>
        </AppView>
      ) : (
        <FlatList
          data={filteredOrganisations}
          nestedScrollEnabled={true}
          contentContainerStyle={{paddingBottom: 100, paddingTop: 16}}
          showsHorizontalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={getInitialData}
          keyExtractor={(item, index) => index.toString()}
          ListEmptyComponent={
            <AppView
              style={[
                $.flex_1,
                $.justify_content_center,
                $.align_items_center,
                $.p_large,
              ]}>
              <CustomIcon
                color={$.tint_5}
                name={CustomIcons.Search}
                size={$.s_large}
              />
              <AppText style={[$.mt_medium, $.text_primary5, $.text_center]}>
                {selectedPrimaryType || selectedSecondaryType
                  ? 'No services match your filters'
                  : 'No services available'}
              </AppText>
              {(selectedPrimaryType || selectedSecondaryType) && (
                <TouchableOpacity
                  style={[
                    $.mt_medium,
                    $.p_small,
                    $.bg_tint_3,
                    $.border_rounded,
                  ]}
                  onPress={clearFilters}>
                  <AppText style={[$.text_tint_11, $.fw_semibold]}>
                    Clear Filters
                  </AppText>
                </TouchableOpacity>
              )}
            </AppView>
          }
          renderItem={({item, index}) => (
            <AppView
              style={[
                $.mb_medium,
                $.mx_small,
                {
                  backgroundColor: 'white',
                  borderRadius: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                  borderLeftWidth: 4,
                  borderLeftColor: $.tint_3,
                },
              ]}>
              {/* Header Section */}
              <AppView style={[$.p_medium]}>
                <AppView style={[$.flex_row, $.align_items_center]}>
                  <AppText
                    style={[$.fw_bold, $.fs_normal, $.text_primary5, $.flex_1]}>
                    {item.organisationname}
                  </AppText>
                  <TouchableOpacity
                    onPress={() => {
                      getLocationDetail(item.organisationlocationid);
                    }}
                    style={[
                      $.p_tiny,
                      $.border_rounded2,
                      {
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        width: 32,
                        height: 32,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }
                    ]}>
                    <CustomIcon
                      color={$.tint_3}
                      name={CustomIcons.Information}
                      size={$.s_small}
                    />
                  </TouchableOpacity>
                </AppView>

                {/* Address with Location Icon */}
                <AppView style={[$.flex_row, $.align_items_center, $.mt_small]}>
                  <CustomIcon
                    name={CustomIcons.LocationPin}
                    color={$.tint_2}
                    size={$.s_small}
                  />
                  <AppText style={[$.text_tint_ash, $.fs_small, $.ml_small, $.flex_1]}>
                    {item.organisationlocationname},{' '}
                    {item.organisationlocationaddressline1},{' '}
                    {item.organisationlocationcity},{' '}
                    {item.organisationlocationstate},{' '}
                    {item.organisationlocationpincode}
                  </AppText>
                </AppView>
              </AppView>

              {/* Footer Section with Tags and Button */}
              <AppView
                style={[
                  $.flex_row,
                  $.align_items_center,
                  $.p_medium,
                  $.pt_small,
                  $.border_top,
                  {
                    borderTopColor: 'rgba(0,0,0,0.1)',
                    backgroundColor: 'rgba(0,0,0,0.02)',
                    borderBottomLeftRadius: 12,
                    borderBottomRightRadius: 12
                  },
                ]}>
                {/* Tags */}
                <AppView style={[$.flex_row, $.flex_wrap_wrap, $.flex_1]}>
                  {item.organisationprimarytypecode && (
                    <AppView
                      style={[
                        $.px_small,
                        $.py_tiny,
                        $.mr_small,
                        $.border_rounded,
                        {
                          backgroundColor: 'rgba(0,0,0,0.05)'
                        }
                      ]}>
                      <AppText style={[$.fw_medium, $.fs_small, $.text_tint_2]}>
                        {item.organisationprimarytypecode}
                      </AppText>
                    </AppView>
                  )}

                  {item.organisationsecondarytypecode && (
                    <AppView
                      style={[
                        $.px_small,
                        $.py_tiny,
                        $.border_rounded,
                        {
                          backgroundColor: 'rgba(0,0,0,0.03)'
                        }
                      ]}>
                      <AppText style={[$.fw_medium, $.fs_small, $.text_tint_1]}>
                        {item.organisationsecondarytypecode}
                      </AppText>
                    </AppView>
                  )}
                </AppView>

                {/* Book Appointment Button */}
                <TouchableOpacity
                  style={[
                    $.border_rounded,
                    $.px_small,
                    $.py_tiny,
                    $.flex_row,
                    $.align_items_center,
                    {
                      backgroundColor: $.tint_3,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2
                    }
                  ]}
                  onPress={() => {
                    navigation.navigate('AppoinmentFixing', {
                      organisationid: item.organisationid,
                      organisationlocationid: item.organisationlocationid,
                    });
                  }}>
                  <CustomIcon
                    color={$.tint_11}
                    name={CustomIcons.Scheduled}
                    size={$.s_small}
                  />
                  <AppText style={[$.fw_medium, $.fs_small, $.text_tint_11, $.ml_small]}>
                    Book Now
                  </AppText>
                </TouchableOpacity>
              </AppView>
            </AppView>
          )}
        />
      )}

      {/* Bottom Sheets */}
      <BottomSheetComponent
        ref={PrimarybottomSheetRef}
        screenname={'Primary Business Type'}
        Save={() => {}}
        showbutton={false}
        close={() => PrimarybottomSheetRef.current?.close()}>
        <AppView style={[$.pb_medium]}>
          {isloading ? (
            <AppView
              style={[
                $.p_medium,
                $.align_items_center,
                $.justify_content_center,
              ]}>
              <ActivityIndicator size="small" color={$.tint_3} />
            </AppView>
          ) : (
            <FlatList
              data={primaryBusinessTypes}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled={true}
              contentContainerStyle={[$.py_small, $.flex_1, {flexWrap: 'wrap'}]}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({item, index}) => (
                <TouchableOpacity
                  onPress={() => {
                    handlePrimaryTypeSelect(item);
                    PrimarybottomSheetRef.current.close();
                  }}
                  style={[
                    $.border,
                    $.border_rounded,
                    $.mr_small,
                    $.mb_small,
                    $.px_small,
                    $.py_small,
                    {
                      backgroundColor: 'white',
                      borderColor: 'rgba(0,0,0,0.1)',
                      minWidth: 120,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 1
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
          )}
        </AppView>
      </BottomSheetComponent>

      <BottomSheetComponent
        ref={SecondarybottomSheetRef}
        screenname={'Secondary Business Type'}
        Save={() => {}}
        showbutton={false}
        close={() => SecondarybottomSheetRef.current?.close()}>
        <AppView style={[$.pb_medium]}>
          {isloading ? (
            <AppView
              style={[
                $.p_medium,
                $.align_items_center,
                $.justify_content_center,
              ]}>
              <ActivityIndicator size="small" color={$.tint_3} />
            </AppView>
          ) : (
            <FlatList
              data={secondaryBusinessTypes}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              nestedScrollEnabled={true}
              contentContainerStyle={[$.py_small, $.flex_1, {flexWrap: 'wrap'}]}
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
                      backgroundColor: 'white',
                      borderColor: 'rgba(0,0,0,0.1)',
                      minWidth: 120,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 1
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
          )}
        </AppView>
      </BottomSheetComponent>

      {/* Business Details Modal */}
      <Modal
        visible={showBusinessDetails}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowBusinessDetails(false)}>
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <View style={{ 
            width: '90%',
            maxHeight: '80%',
            backgroundColor: 'white',
            borderRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5
          }}>
            {/* Header */}
            <AppView style={[
              $.flex_row, 
              $.align_items_center, 
              $.p_medium, 
              { 
                borderBottomWidth: 1, 
                borderBottomColor: 'rgba(0,0,0,0.1)',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                backgroundColor: 'rgba(0,0,0,0.02)'
              }
            ]}>
              <AppText style={[$.fs_medium, $.fw_semibold, $.flex_1]}>
                Business Details
              </AppText>
              <TouchableOpacity
                onPress={() => setShowBusinessDetails(false)}
                style={[
                  $.p_tiny,
                  $.border_rounded,
                  { backgroundColor: 'rgba(0,0,0,0.05)' }
                ]}>
                <CustomIcon
                  name={CustomIcons.Close}
                  color={$.tint_2}
                  size={$.s_small}
                />
              </TouchableOpacity>
            </AppView>

            {/* Content */}
            <ScrollView 
              contentContainerStyle={{padding: 16}}
              showsVerticalScrollIndicator={false}>
              {/* Business Info */}
              <AppText style={[$.fs_normal, $.fw_bold, $.mb_small, $.text_primary5]}>
                {organisationdetail.BusinessName || 'Business Name Not Available'}
              </AppText>
              
              {/* Address Section */}
              <AppView style={[$.mb_small, $.p_small, $.border_rounded, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                <AppView style={[$.flex_row, $.align_items_center, $.mb_tiny]}>
                  <CustomIcon
                    name={CustomIcons.LocationPin}
                    color={$.tint_2}
                    size={$.s_small}
                  />
                  <AppText style={[$.ml_small, $.text_tint_ash, $.fw_medium, $.fs_small]}>
                    Address
                  </AppText>
                </AppView>
                <AppText style={[$.text_tint_ash, $.ml_small, $.fs_small]}>
                  {organisationdetail.StreetName &&
                    `${organisationdetail.StreetName}, `}
                  {organisationdetail.Area}
                </AppText>
                <AppText style={[$.text_tint_ash, $.ml_small, $.mt_tiny, $.fs_small]}>
                  {organisationdetail.City && `${organisationdetail.City}, `}
                  {organisationdetail.State && `${organisationdetail.State}`}
                  {organisationdetail.PostalCode &&
                    ` - ${organisationdetail.PostalCode}`}
                </AppText>
              </AppView>

              {/* Services Section */}
              <AppText style={[$.fs_small, $.fw_semibold, $.mb_small, $.text_primary5]}>
                Services Offered
              </AppText>
              {organisationdetail.Services.length > 0 ? (
                organisationdetail.Services.map((service, index) => (
                  <AppView
                    key={index}
                    style={[
                      $.mb_small,
                      $.p_small,
                      $.border_rounded,
                      {
                        backgroundColor: 'white',
                        borderWidth: 1,
                        borderColor: 'rgba(0,0,0,0.1)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 1
                      }
                    ]}>
                    <AppText style={[$.fw_medium, $.text_primary5, $.fs_small]}>
                      {service.ServiceName || 'Unnamed Service'}
                    </AppText>
                    <AppView style={[$.flex_row, $.align_items_center, $.mt_tiny]}>
                      <AppText style={[$.text_tint_ash, $.fs_small]}>
                        Price: ₹{service.Price || 0}
                      </AppText>
                      {service.OfferPrice > 0 && (
                        <AppText style={[$.ml_small, { color: 'green' }, $.fs_small]}>
                          Offer: ₹{service.OfferPrice}
                        </AppText>
                      )}
                    </AppView>
                    <AppText style={[$.text_tint_ash, $.mt_tiny, $.fs_small]}>
                      Duration: {service.Duration || 0} mins
                    </AppText>
                  </AppView>
                ))
              ) : (
                <AppText style={[$.text_tint_ash, $.p_small, $.border_rounded, $.fs_small, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                  No services listed.
                </AppText>
              )}

              {/* Timings Section */}
              <AppText style={[$.fs_small, $.fw_semibold, $.mb_small, $.mt_small, $.text_primary5]}>
                Business Timings
              </AppText>
              {organisationdetail.Timings.length > 0 ? (
                organisationdetail.Timings.map((timing, index) => (
                  <AppView 
                    key={index} 
                    style={[
                      $.mb_small,
                      $.p_small,
                      $.border_rounded,
                      {
                        backgroundColor: 'white',
                        borderWidth: 1,
                        borderColor: 'rgba(0,0,0,0.1)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 1
                      }
                    ]}>
                    <AppText style={[$.fw_medium, $.text_primary5, $.fs_small]}>
                      {getDayName(timing.Day)}
                    </AppText>
                    <AppText style={[$.text_tint_ash, $.mt_tiny, $.fs_small]}>
                      {formatTime(timing.StartTime)} - {formatTime(timing.EndTime)}
                    </AppText>
                  </AppView>
                ))
              ) : (
                <AppText style={[$.text_tint_ash, $.p_small, $.border_rounded, $.fs_small, { backgroundColor: 'rgba(0,0,0,0.02)' }]}>
                  No timings available.
                </AppText>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AppView>
  );
}
