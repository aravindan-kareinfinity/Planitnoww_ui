import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { HomeTabParamList } from '../../hometab.navigation';
import {
    CompositeScreenProps,
    useFocusEffect,
    useNavigation,
    useRoute,
} from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../appstack.navigation';
import { useMemo, useRef, useState } from 'react';
import { AppView } from '../../components/appview.component';
import { AppText } from '../../components/apptext.component';
import { AppButton } from '../../components/appbutton.component';
import { $ } from '../../styles';
import { AppTextInput } from '../../components/apptextinput.component';
import { CustomIcon, CustomIcons } from '../../components/customicons.component';
import { Alert, FlatList, TouchableOpacity } from 'react-native';

import {
    OrganisationLocation,
    OrganisationLocationSelectReq,
} from '../../models/organisationlocation.model';
import { useAppSelector } from '../../redux/hooks.redux';
import { selectusercontext } from '../../redux/usercontext.redux';
import { AppAlert } from '../../components/appalert.component';
import { OrganisationLocationService } from '../../services/organisationlocation.service';
import { useEffect } from 'react';
import React from 'react';
import { Organisation, OrganisationSelectReq } from '../../models/organisation.model';
import { OrganisationService } from '../../services/organisation.service';
import { OrganisationServiceTimingService } from '../../services/organisationservicetiming.service';
import { environment } from '../../utils/environment';
import { OrganisationServiceTimingFinal, OrganisationServiceTimingSelectReq, Weeks } from '../../models/organisationservicetiming.model';
import { OrganisationServicesService } from '../../services/organisationservices.service';
import { OrganisationServices, OrganisationServicesSelectReq } from '../../models/organisationservices.model';
import { DatePickerComponent } from '../../components/Datetimepicker.component';
import { Appoinment, SelectedSerivice } from '../../models/appoinment.model';
import { BottomSheetComponent } from '../../components/bottomsheet.component';
type AppoinmentFixingScreenProp = CompositeScreenProps<
    NativeStackScreenProps<AppStackParamList, 'AppoinmentFixing'>,
    BottomTabScreenProps<HomeTabParamList>
>;
export function AppoinmentFixingScreen() {
    const navigation = useNavigation<AppoinmentFixingScreenProp['navigation']>();
    const [organisationservices, setOrganisationservices] = useState<OrganisationServices[]>([]);
    const [organisationlocationTiming, setOrganisationlocationTiming] = useState<
        Appoinment[]
    >([]);
    const [seletedTiming, setSelectedtiming] = useState(new Appoinment());
    const [showdatepicker, setshowdatepicker] = useState(false)
    const [isloading, setIsloading] = useState(false);
    const servicesAvailableservice = useMemo(() => new OrganisationServicesService(), []);
    const organisationservicetiming = useMemo(() => new OrganisationServiceTimingService(), []);
    const usercontext = useAppSelector(selectusercontext);
    const route = useRoute<AppoinmentFixingScreenProp['route']>();
    const [seleteddate, setselectedate] = useState(new Date);
    const bottomSheetRef = useRef<any>(null);
    const [selectedService, setSelectedService] = useState<SelectedSerivice[]>([]);
    const handleServiceSelection = (req: OrganisationServices) => {
        var item = new SelectedSerivice();
        item.id = req.id;
        item.servicename = req.Servicename;
        item.serviceprice = req.offerprize;
        item.servicetimetaken = req.timetaken;
        item.iscombo = req.Iscombo;

        setSelectedService(prevSelected => {
            const isSelected = prevSelected.some(service => service.id === item.id);

            setSelectedtiming(prev => {
                let baseTime = prev?.totime ? new Date(prev.totime) : new Date(seletedTiming.fromtime);

                if (isSelected) {
                    // Remove: Subtract time
                    baseTime.setMinutes(baseTime.getMinutes() - req.timetaken);
                } else {
                    // Add: Increase time
                    baseTime.setMinutes(baseTime.getMinutes() + req.timetaken);
                }

                return {
                    ...prev,
                    totime: baseTime
                };
            });

            if (isSelected) {
                return prevSelected.filter(service => service.id !== item.id);
            } else {
                return [...prevSelected, item];
            }
        });
    };



    useFocusEffect(
        React.useCallback(() => {
            getdata();
        }, []),
    );

    useEffect(() => {

        gettiming()
    }, [seleteddate]);

    useEffect(() => {

    }, [organisationlocationTiming]);


    const gettiming = async () => {
        try {
            var organizariontimereq = new OrganisationServiceTimingSelectReq()
            organizariontimereq.organisationid = route.params.organisationid;
            organizariontimereq.organizationlocationid = route.params.organisationlocationid;

            const dayName = seleteddate.toLocaleDateString('en-US', { weekday: 'long' }); // "Friday"

            const dayNumber = Weeks[dayName as keyof typeof Weeks]; // Convert string to number

            organizariontimereq.day_of_week = dayNumber;
            console.log("organizariontimereq", organizariontimereq);

            var organisationtimingres = await organisationservicetiming.selecttimingslot(organizariontimereq)

            if (organisationtimingres) {
                setOrganisationlocationTiming(organisationtimingres)
            }
        } catch {
            Alert.alert(environment.baseurl, "error")
        }
    }

    const getdata = async () => {
        try {
            var organisationservicereq = new OrganisationServicesSelectReq()
            organisationservicereq.parentid = route.params.organisationid;
            var organisationserviceres = await servicesAvailableservice.select(organisationservicereq)
            if (organisationserviceres) {
                setOrganisationservices(organisationserviceres)
            }
        } catch {
            Alert.alert(environment.baseurl, "Error in get timing")
        }
    }

    const openBottomSheet = () => {
        bottomSheetRef.current?.open();
    };
    const closeBottomSheet = () => {
        bottomSheetRef.current?.close();
    }

    const save = async () => {
        bottomSheetRef.current?.close();
    }


    return (

        <AppView style={[$.pt_normal, $.flex_1]}>
            <AppView style={[$.flex_row, $.align_items_center]}>
                <AppText style={[$.fs_large, $.fw_bold, $.flex_1, $.px_small, $.text_tint_9]}>Appoinment </AppText>
                <TouchableOpacity
                    onPress={() => setshowdatepicker(true)}
                    style={[
                        $.border,
                        $.border_rounded,
                        $.p_small,
                        $.mr_small,
                        $.align_items_center,
                        $.justify_content_center,
                        $.bg_tint_10, $.border_tint_7,

                    ]}
                >
                    <AppText style={{ fontSize: 14, fontWeight: "bold", color: "#333" }}>
                        {seleteddate.toDateString()}
                    </AppText>
                </TouchableOpacity>

            </AppView>

            <BottomSheetComponent ref={bottomSheetRef} screenname='New Service' Save={save} close={closeBottomSheet}>
                <AppView>
                    <AppText>{seletedTiming?.fromtime ? new Date(seletedTiming.fromtime).toLocaleTimeString() : ''} -
                        {seletedTiming?.totime ? new Date(seletedTiming.totime).toLocaleTimeString() : ''}
                    </AppText>
                </AppView>

                <FlatList
                    data={organisationservices}
                    nestedScrollEnabled={true}
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => {
                        const isSelected = selectedService.some(service => service.id === item.id);

                        return (
                            <TouchableOpacity
                                style={[
                                    $.mb_small,
                                    $.border,
                                    $.border_rounded,
                                    $.bg_tint_10,
                                    isSelected ? { backgroundColor: "lightgreen", borderColor: "green", borderWidth: 2 } : {},
                                ]}
                                onPress={() => handleServiceSelection(item)}
                            >
                                <AppView style={[$.flex_row]}>
                                    <AppText style={[$.p_small, $.flex_1, $.text_tint_1, $.fs_compact, $.fw_bold]}>
                                        {item.Servicename}
                                    </AppText>
                                </AppView>

                                <AppView style={[$.flex_row, $.align_items_center]}>
                                    <AppText style={[$.p_small, $.text_success, $.fw_bold]}>
                                        Offer Price: {item.offerprize}
                                    </AppText>
                                    <AppText style={[$.p_small, $.text_tint_2, $.fw_medium, { textDecorationLine: "line-through", marginLeft: 8 }]}>
                                        Original Price: {item.prize}
                                    </AppText>
                                </AppView>

                                <AppText style={[$.p_small]}>Time taken in minutes: {item.timetaken}</AppText>
                            </TouchableOpacity>
                        );
                    }}
                />

            </BottomSheetComponent>

            
            {organisationlocationTiming && organisationlocationTiming.length > 0 &&
            <AppView style={[$.py_huge]}>

                <FlatList
                   data={organisationlocationTiming}
                   nestedScrollEnabled={true}
                   // refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
                   showsHorizontalScrollIndicator={false}
                   keyExtractor={(item, index) => index.toString()}
                   renderItem={({ item, index }) => {
   
   
                       return (
                           <TouchableOpacity
                               onPress={() => {
                                   setSelectedtiming(item);
                                   bottomSheetRef.current?.open();
                               }}
                               style={[$.flex_1, $.p_tiny, $.flex_row, $.align_items_center, $.p_small]}
                           >
                               {/* Time Display */}
                               <AppText style={[$.p_small, $.fw_medium,{position:'relative',top:-35}]}>
                               {item?.fromtime 
  ? new Date(item.fromtime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) 
  : "N/A"}

                               </AppText>
   
                               {/* Status Display */}
                               <AppText
                                   style={[
                                       $.p_small,
                                       $.flex_1,
                                       $.text_center,
                                       $.text_tint_2,
                                       $.fw_bold,
                                       $.border_bottom,
                                       $.border_tint_10,
                                   ]}
                               >
                                   Status: {item?.statuscode ?? "N/A"}
                               </AppText>
                           </TouchableOpacity>
   
   
   
                       );
                   }}
               />
            </AppView>
            }



            <DatePickerComponent
                date={seleteddate}
                show={showdatepicker}
                mode="date"
                setShow={() => setshowdatepicker(false)}
                setDate={(v) => {
                    console.log("jsnfls", v);
                    setselectedate(v)
                }}
            />

        </AppView>
    );
}
