import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {HomeTabParamList} from '../../hometab.navigation';
import {CompositeScreenProps, useNavigation} from '@react-navigation/native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AppStackParamList} from '../../appstack.navigation';
import {useEffect, useMemo, useState} from 'react';
import {AppView} from '../../components/appview.component';
import {AppText} from '../../components/apptext.component';
import {AppButton} from '../../components/appbutton.component';
import {$} from '../../styles';
import {AppTextInput} from '../../components/apptextinput.component';
import {CustomIcon, CustomIcons} from '../../components/customicons.component';
import {ScrollView, TouchableOpacity, ActivityIndicator} from 'react-native';
import {
  OrganisationLocation,
  OrganisationLocationSelectReq,
} from '../../models/organisationlocation.model';
import {OrganisationLocationService} from '../../services/organisationlocation.service';
import {AppAlert} from '../../components/appalert.component';
import {useAppSelector} from '../../redux/hooks.redux';
import {selectusercontext} from '../../redux/usercontext.redux';
import {LocationPicker} from '../../components/LocationPicker';

type LocationScreenProp = CompositeScreenProps<
  NativeStackScreenProps<AppStackParamList, 'Location'>,
  BottomTabScreenProps<HomeTabParamList>
>;

export function LocationScreen(props: LocationScreenProp) {
  const navigation = useNavigation<LocationScreenProp['navigation']>();
  const [isLoading, setIsLoading] = useState(false);
  const [organisationLocation, setOrganisationLocation] = useState<OrganisationLocation>(new OrganisationLocation());
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isFromMap, setIsFromMap] = useState(false);
  const userContext = useAppSelector(selectusercontext);
  const organisationLocationService = useMemo(
    () => new OrganisationLocationService(),
    [],
  );

  useEffect(() => {
    fetchLocationData();
  }, []);

  const fetchLocationData = async () => {
    if (!props.route.params?.id) return;

    setIsLoading(true);
    try {
      const locReq = new OrganisationLocationSelectReq();
      locReq.id = props.route.params.id;
      locReq.organisationid = userContext.value.organisationid;

      const locations = await organisationLocationService.select(locReq);
      if (locations && locations.length > 0) {
        setOrganisationLocation(locations[0]);
        if (locations[0].googlelocation) {
          setIsFromMap(true);
        }
      }
    } catch (error) {
      handleError(error, 'Failed to fetch location details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validateFields()) return;
    
    setIsLoading(true);
    try {
      const locationToSave = {
        ...organisationLocation,
        organisationid: userContext.value.organisationid,
        // Ensure we're only sending valid fields to the server
        id: organisationLocation.id || 0, // Default to 0 if not set (for new locations)
        name: organisationLocation.name?.trim(),
        addressline1: organisationLocation.addressline1?.trim(),
        addressline2: organisationLocation.addressline2?.trim(),
        city: organisationLocation.city?.trim(),
        state: organisationLocation.state?.trim(),
        country: organisationLocation.country?.trim(),
        pincode: organisationLocation.pincode?.trim(),
        latitude: organisationLocation.latitude,
        longitude: organisationLocation.longitude,
        googlelocation: organisationLocation.googlelocation,
        attributes: {} // Replace with an appropriate object or import AttributesData if it exists
        
      };
  
      console.log('Sending location data:', locationToSave);
  
      const response = await organisationLocationService.save(locationToSave);
      
      if (response) {
        AppAlert({message: 'Location saved successfully'});
        navigation.goBack();
      } else {
        throw new Error('Empty response from server');
      }
    } catch (error: any) {
      console.error('Full error object:', error);
      
      // Handle Axios error specifically
      if (error.isAxiosError) {
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Failed to save location';
        
        console.error('Server response:', error.response?.data);
        AppAlert({message: `Error: ${errorMessage}`});
      } else {
        AppAlert({message: error.message || 'Failed to save location'});
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateFields = () => {
    const requiredFields = ['name', 'addressline1', 'city', 'state', 'pincode'];
    const missingFields = requiredFields.filter(
      field => !organisationLocation[field as keyof OrganisationLocation]?.toString().trim()
    );

    if (missingFields.length > 0) {
      AppAlert({message: `Please fill in all required fields (${missingFields.join(', ')})`});
      return false;
    }
    return true;
  };

  const handleError = (error: unknown, defaultMessage: string) => {
    const message = (error as any)?.response?.data?.message || defaultMessage;
    AppAlert({message});
    console.error('Location Error:', error);
  };

  const handleLocationSelect = (location: {
    latitude: number;
    longitude: number;
    address: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  }) => {
    setOrganisationLocation(prev => ({
      ...prev,
      latitude: location.latitude,
      longitude: location.longitude,
      googlelocation: location.address,
      addressline1: location.address.split(',')[0] || location.address,
      city: location.city || prev.city,
      state: location.state || prev.state,
      country: location.country || prev.country,
      pincode: location.pincode || prev.pincode,
      locationname: location.address,
      locationcity: location.city || '',
      locationstate: location.state || '',
      locationcountry: location.country || '',
      locationpincode: location.pincode || '',
    }));
    setIsFromMap(true);
    setShowLocationPicker(false);
  };

  const updateOrganisationLocation = <K extends keyof OrganisationLocation>(
    field: K,
    value: OrganisationLocation[K],
  ) => {
    setOrganisationLocation(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <AppView style={[$.pt_normal, $.flex_1]}>
      {/* Header */}
      <AppView style={[$.flex_row, $.ml_regular, $.align_items_center, $.mb_medium]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <CustomIcon
            name={CustomIcons.LeftArrow}
            size={$.s_regular}
            color={$.tint_2}
          />
        </TouchableOpacity>
        <AppText style={[$.ml_compact, $.p_small, $.text_tint_2, $.fw_medium]}>
          {props.route.params?.id ? 'Edit Location' : 'Add Location'}
        </AppText>
      </AppView>

      {/* Location Picker Button */}
      <TouchableOpacity
        onPress={() => setShowLocationPicker(true)}
        style={[$.mb_normal, $.p_small, $.bg_tint_10, $.border_rounded, $.mx_regular]}>
        <AppText style={[$.text_tint_3]}>{'Select Location on Map'}</AppText>
      </TouchableOpacity>

      {showLocationPicker && (
        <LocationPicker
          visible={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          onLocationSelect={handleLocationSelect}
        />
      )}

      {isLoading ? (
        <AppView style={[$.flex_1, $.justify_content_center, $.align_items_center]}>
          <ActivityIndicator size="large" color={$.tint_primary_5} />
        </AppView>
      ) : (
        <ScrollView style={[$.flex_1, $.pb_large]}>
          {/* Form Fields */}
          <AppTextInput
            style={[$.bg_tint_11, $.mx_regular, $.mb_medium]}
            placeholder="Location name*"
            value={organisationLocation.name}
            onChangeText={value => updateOrganisationLocation('name', value)}
          />

          <AppTextInput
            style={[$.bg_tint_11, $.mx_regular, $.mb_medium]}
            placeholder="No, Building name*"
            value={organisationLocation.addressline1}
            onChangeText={value => updateOrganisationLocation('addressline1', value)}
          />

          <AppTextInput
            style={[$.bg_tint_11, $.mx_regular, $.mb_medium]}
            placeholder="Road name, Area"
            value={organisationLocation.addressline2}
            onChangeText={value => updateOrganisationLocation('addressline2', value)}
          />

          <AppTextInput
            style={[$.bg_tint_11, $.flex_1, $.mr_medium, $.mb_medium, $.mx_regular]}
            placeholder="State*"
            value={organisationLocation.state}
            onChangeText={value => updateOrganisationLocation('state', value)}
            readonly={!isFromMap}
          />
          
          <AppTextInput
            style={[$.bg_tint_11, $.flex_1, $.mb_medium, $.mx_regular]}
            placeholder="City*"
            value={organisationLocation.city}
            onChangeText={value => updateOrganisationLocation('city', value)}
            readonly={!isFromMap}
          />

          <AppView style={[$.mx_regular, $.mb_medium]}>
            <AppTextInput
              style={[$.bg_tint_11]}
              placeholder="Pincode*"
              value={organisationLocation.pincode}
              onChangeText={value => updateOrganisationLocation('pincode', value)}
              keyboardtype="numeric"
              maxLength={6}
              readonly={!isFromMap}
            />
          </AppView>
        </ScrollView>
      )}

      {/* Footer Buttons */}
      <AppView style={[$.flex_row, $.justify_content_center, $.mx_regular, $.mb_medium, $.py_regular]}>
        <AppButton
          name="Cancel"
          style={[$.bg_tint_11, $.flex_1, $.mr_huge]}
          textStyle={[$.text_danger]}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        />
        <AppButton
          name={props.route.params?.id ? 'Update' : 'Save'}
          style={[$.bg_success, $.flex_1]}
          textStyle={[$.text_tint_11]}
          onPress={handleSave}
          isLoading={isLoading}
          disabled={isLoading}
        />
      </AppView>
    </AppView>
  );
}