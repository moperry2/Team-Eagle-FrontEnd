import {
  Box,
  Button,
  ChakraProvider,
  Flex,
  Input,
  Stack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Center,
  Text,
  Divider,
  SimpleGrid,
  Spacer,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons'
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { Link } from 'react-router-dom';
import Map from './Map';
import {
  createCalcData,
  createCommute,
  createVehicle,
  getCarModels,
  getGasPrice,
  getMakes,
  getVehicleSpecs,
  saveCalculationToUser,
} from "../utils/api";
import { roundNumber, splitAddress } from "../utils/helpers";
import { YEARS } from "../utils/constants";
import { AppContext } from "../App";
import axios from "axios";

import ResultSlider from "./ResultSlider";
import ProgressBar from "./ProgressBar";

export default function Home() {
  const originRef = useRef();
  const destinationRef = useRef();
  const [selectYear, setSelectYear] = useState(0);
  const [carMakes, setCarMakes] = useState([]);
  const [carMakeID, setCarMakeID] = useState("1");
  const [workDay, setWorkDay] = useState(1);
  const [carModels, setCarModels] = useState([]);
  const [carTrimID, setCarTrimID] = useState("");
  const [combinedMPGVal, setCombinedMPGVal] = useState("");
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [commuteId, setCommuteId] = useState(0);

  const {
    resultCalculation,
    setResultCalculation,
    currentStep,
    setCurrentStep,
  } = useContext(AppContext);

  const [progressBar, setProgressBar] = useState(0);

  useEffect(() => {
    const getMakesAsync = async () => {
      const makes = await getMakes();
      setCarMakes(makes);
    };
    getMakesAsync();
    setCurrentStep(1);
  }, []);

  useEffect(() => {
    if (selectYear && carMakeID) {
      const getCarModelsAsync = async () => {
        const result = await getCarModels(selectYear, carMakeID);
        if (result.data.length === 0) {
          setCombinedMPGVal(0);
        }
        setCarModels(result.data);
      };
      getCarModelsAsync();
    }
  }, [selectYear, carMakeID]);

  useEffect(() => {
    if (selectYear && carTrimID) {
      const getMpg = async () => {
        const mpgValueData = await getVehicleSpecs(selectYear, carTrimID);
        if (mpgValueData) {
          const roundedMPGVal = roundNumber(mpgValueData);
          setCombinedMPGVal(roundedMPGVal);
        } else {
          setCombinedMPGVal(0.0);
        }
      };
      getMpg();
    }
  }, [selectYear, carTrimID]);

  const calculateRoute = async () => {
    if (originRef.current.value === "" || destinationRef.current.value === "") {
      return;
    }
    // eslint-disable-next-line no-undef
    const directionsService = new google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: originRef.current.value,
      destination: destinationRef.current.value,
      // eslint-disable-next-line no-undef
      travelMode: google.maps.TravelMode.DRIVING,
    });

    const distanceResult = results.routes[0].legs[0].distance.text;
    setDirectionsResponse(results);
    setDuration(results.routes[0].legs[0].duration.text);
    setDistance(distanceResult);
    return distanceResult;
  };

  const commutePostData = async (distanceValue, directions) => {
    let cityStart = splitAddress(originRef.current.value);
    let cityEnd = splitAddress(destinationRef.current.value);
    const startAvgGasLocation = await getGasPrice(cityStart);
    const endAvgGasLocation = await getGasPrice(cityEnd);
    const startGas = startAvgGasLocation.data.locationAverage;
    const endGas = endAvgGasLocation.data.locationAverage;
    const avgGasLocation = roundNumber((startGas + endGas) / 2);
    const response = await createCommute(
      originRef.current.value,
      destinationRef.current.value,
      workDay,
      distanceValue,
      avgGasLocation,
      startGas,
      endGas,
      directions
    );
    return response.data.id;
  };

  return (
    <Flex className='description' direction='column' alignItems='center'>
      {currentStep === 1 && (
        <>
          <Box m='10px'>Welcome to Commutilator!</Box>
          <Divider h='2vh' variant='unstyled' />
          <Box w='80%' h='1.5' bg='brand.purple' borderRadius='full' />
          <Divider h='2vh' variant='unstyled' />
          <Box m='10px'>
            Commutilator helps you calculate the cost of your commute, whether to work, school, or even the grocery store, using your route, your personal vehicle information, and local gas prices. We hope you are able to use our app to make informed decisions about your drive!
          </Box>
        </>
      )}
      {currentStep === 2 && (
        <>
          <Divider h='5vh' variant='unstyled' />
          <ProgressBar
            key={'p-bar'}
            bgcolor={'#F0B199'}
            completed={progressBar}
          />
          <Box className='steps' m='10px'>
            Step 1 - Enter your route information.
          </Box>
          <Stack className='fields'>
            <Box>
              <Text htmlFor='starting-location-field'>
                Start:{' '}
              </Text>
              <Autocomplete>
                <Input
                  shadow='sm'
                  bg='white'
                  type='text'
                  placeholder='Enter a Location'
                  ref={originRef}
                />
              </Autocomplete>
            </Box>
            <Box>
              <Text htmlFor='ending-location-field'>End: </Text>
              <Autocomplete>
                <Input
                  shadow='sm'
                  bg='white'
                  type='text'
                  placeholder='Enter a Location'
                  ref={destinationRef}
                />
              </Autocomplete>
            </Box>
            <Box>
              <Text htmlFor='work-days-field'>Days per Week Commuting:</Text>
              <NumberInput
                shadow='sm'
                bg='white'
                min={1}
                max={7}
                precision={0}
                value={workDay}
                onChange={(workDay) => setWorkDay(workDay)}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Box>
          </Stack>
        </>
      )}
      {currentStep === 3 && (
        <>
          <Divider h='5vh' variant='unstyled' />
          <ProgressBar
            key={'p-bar'}
            bgcolor={'#F0B199'}
            completed={progressBar}
          />
          <Box className='steps' m='10px'>
            Step 2 - Enter your vehicle information.
          </Box>
          <Stack>
            <Box className='fields'>
              {carModels.length === 0 ? (
                <Box>No models found, please enter MPG</Box>
              ) : combinedMPGVal === 0.0 ? (
                <Box>No MPG found, please enter MPG</Box>
              ) : (
                ''
              )}
              {/* {combinedMPGVal === 0.0 && (
                <Box>No MPG found, please enter MPG</Box>
              )} */}
              <Text htmlFor='mpg-input-field'>MPG:</Text>
              <Input
                shadow='sm'
                bg='white'
                placeholder='Enter Miles Per Gallon'
                id='mpg-input-field'
                type='text'
                value={combinedMPGVal}
                onChange={(e) => setCombinedMPGVal(e.target.value)}
                required
              />
            </Box>
            <Text className='steps' m='10px'>OR</Text>
            <Box className='fields'>
              <Text htmlFor='year-field'>Car Year:</Text>
              <select
                id='year-field'
                defaultValue=''
                onChange={(e) => setSelectYear(e.target.value)}
              >
                <option value='' disabled hidden>
                  Select Car Year
                </option>
                {YEARS.map((year, index) => (
                  <option key={index} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <Text htmlFor='car-make-field'>Car Make:</Text>
              <select
                id='car-make-field'
                defaultValue=''
                onChange={(e) => setCarMakeID(e.target.value)}
              >
                <option value='' disabled hidden>
                  Select Car Make
                </option>
                {carMakes.map((carMake, index) => (
                  <option key={index} value={carMake.Id}>
                    {carMake.Name}
                  </option>
                ))}
              </select>
              <Text htmlFor='car-model-field'>Car Model:</Text>
              <select
                id='car-model-field'
                defaultValue=''
                onChange={(e) => setCarTrimID(e.target.value)}
              >
                <option value='' disabled hidden>
                  Select Car Model
                </option>
                {carModels.length > 0 ? (
                  carModels.map((carModel, index) => (
                    <option key={index} value={carModel.TrimId}>
                      {carModel.ModelName} {carModel.TrimName}
                    </option>
                  ))
                ) : (
                  <option>No models found</option>
                )}
              </select>
            </Box>
          </Stack>
        </>
      )}
      {currentStep === 4 && (
        <>
          <Box className='steps' m='10px'>
            Commute Results
          </Box>
          <SimpleGrid w='80%' columns={2}>
            <Box shadow='base'>
              <Map directionsResponse={directionsResponse} />
            </Box>
            <Stack alignItems='center' className='description'>
              <ResultSlider />
              <Spacer />
              <Link
                style={{ color: '#F0B199' }}
                to={`/details/${resultCalculation.id}?fromDetails=true`}
              >
                View More Details
              </Link>
            </Stack>
          </SimpleGrid>
          <ProgressBar
            key={'p-bar'}
            bgcolor={'#F0B199'}
            completed={progressBar}
          />
        </>
      )}

      {/*buttons*/}
      {currentStep === 1 && (
        <Button
          className='subtitle'
          shadow='md'
          mt='20px'
          variant='outline'
          bg='brand.aqua'
          colorScheme='black'
          onClick={async () => {
            setProgressBar(0)
            setCurrentStep(currentStep + 1);
          }}
        >
          Click to Begin
        </Button>
      )}
      {currentStep === 2 && (
        <Button
          className='subtitle'
          shadow='md'
          mt='20px'
          bg='brand.aqua'
          variant='outline'
          colorScheme='black'
          onClick={async () => {
            let [distanceResult] = await Promise.all([calculateRoute()]);
            let [commuteId] = await Promise.all([
              commutePostData(distanceResult),
            ]);
            setProgressBar(50);
            setCommuteId(commuteId);
            setCurrentStep(currentStep + 1);
          }}
        >
          Next
        </Button>
      )}
      {currentStep === 3 && (
        <Button
          className='subtitle'
          shadow='md'
          mt='20px'
          bg='brand.aqua'
          variant='outline'
          colorScheme='black'
          onClick={async (e) => {
            e.preventDefault();
            setProgressBar(100);
            let [vehicleId] = await Promise.all([
              createVehicle(combinedMPGVal),
            ]);
            let [data] = await Promise.all([
              createCalcData(commuteId, vehicleId),
            ]);
            setResultCalculation(data);
            saveCalculationToUser(data.id);
            setCurrentStep(currentStep + 1);
          }}
        >
          Commutilate Route
        </Button>
      )}
      {currentStep === 4 && (
        <Button
          className='subtitle'
          shadow='md'
          mt='20px'
          bg='brand.aqua'
          variant='outline'
          colorScheme='black'
          onClick={() => {
            setProgressBar(0);
            setCommuteId(0);
            setResultCalculation({
              result: { weekly: '' },
            });
            setCombinedMPGVal('');
            setCurrentStep(1);
            setWorkDay(1);
          }}
        >
          New Calculation
        </Button>
      )}
    </Flex>
  );
}
