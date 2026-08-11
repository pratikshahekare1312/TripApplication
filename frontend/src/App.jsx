import { useState } from 'react';
import axios from 'axios';

import './App.css';

import ItineraryResult from './ItineraryResult';
import CityAutocomplete from './CityAutocomplete';


const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir"
];


const DEFAULTS = {
  destination_state: "",
  origin_city: "",

  days: 3,

  group_type: "friends",

  group_composition: [],

  budget_level: "mid",

  vibe: "chill",

  crowd_preference: "medium",

  prefers_offbeat: "No preference",

  solo_female: false,

  wheelchair_needed: false,

  medical_important: false,

  wants_adventure_sports: false,

  wants_water_activities: false,

  wants_trekking: false,

  wants_nightlife: false,

  wants_shopping: false,

  wants_photography: false,

  religious_interest: true,

  carrying_dslr: false,

  internet_important: false
};


const STEPS = [
  {
    key: "destination_state",
    question:
      "Where do you want to go?",
    type: "select",
    options: INDIAN_STATES,
    required: true
  },

  {
    key: "origin_city",
    question:
      "Where are you travelling from?",
    type: "city",
    required: true
  },

  {
    key: "days",
    question:
      "How many days is your trip?",
    type: "select",
    options: [1, 2, 3, 4, 5, 6, 7],
    required: true
  },

  {
    key: "group_type",
    question:
      "Who are you travelling with?",
    type: "select",
    options: [
      "solo",
      "couple",
      "friends",
      "family"
    ],
    required: true
  },

  {
    key: "group_composition",
    question:
      "Does your group include any of these?",
    type: "multiselect",
    options: [
      "Kids",
      "Adults",
      "Seniors"
    ],
    required: false
  },

  {
    key: "budget_level",
    question:
      "What's your budget level?",
    type: "select",
    options: [
      "budget",
      "mid",
      "luxury"
    ],
    required: true
  },

  {
    key: "vibe",
    question:
      "What kind of trip vibe are you looking for?",
    type: "select",
    options: [
      "chill",
      "adventure",
      "spiritual",
      "romantic",
      "family",
      "cultural",
      "party",
      "offbeat"
    ],
    required: true
  },

  {
    key: "crowd_preference",
    question:
      "How much crowd can you handle?",
    type: "select",
    options: [
      "low",
      "medium",
      "high"
    ],
    required: true
  },

  {
    key: "prefers_offbeat",
    question:
      "Popular spots or offbeat gems?",
    type: "select",
    options: [
      "No preference",
      "Popular",
      "Offbeat"
    ],
    required: false
  },

  {
    key: "wants_adventure_sports",
    question:
      "Interested in adventure sports?",
    type: "boolean"
  },

  {
    key: "wants_water_activities",
    question:
      "Interested in water activities?",
    type: "boolean"
  },

  {
    key: "wants_trekking",
    question:
      "Interested in trekking?",
    type: "boolean"
  },

  {
    key: "wants_nightlife",
    question:
      "Interested in nightlife?",
    type: "boolean"
  },

  {
    key: "wants_shopping",
    question:
      "Interested in shopping?",
    type: "boolean"
  },

  {
    key: "wants_photography",
    question:
      "Interested in photography spots?",
    type: "boolean"
  },

  {
    key: "religious_interest",
    question:
      "Interested in visiting religious places?",
    type: "boolean"
  },

  {
    key: "solo_female",
    question:
      "Are you a solo female traveller?",
    type: "boolean"
  },

  {
    key: "wheelchair_needed",
    question:
      "Do you need wheelchair-accessible places?",
    type: "boolean"
  },

  {
    key: "medical_important",
    question:
      "Is nearby medical facility important to you?",
    type: "boolean"
  },

  {
    key: "carrying_dslr",
    question:
      "Are you carrying a DSLR camera?",
    type: "boolean"
  },

  {
    key: "internet_important",
    question:
      "Is good internet connectivity important?",
    type: "boolean"
  }
];


const API_URL =
  "http://localhost:5000/api/generate-plan";


function App() {
  const [formData, setFormData] =
    useState(DEFAULTS);

  const [step, setStep] =
    useState(0);

  const [animKey, setAnimKey] =
    useState(0);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  const [result, setResult] =
    useState(null);


  const current =
    STEPS[step];


  const isLastStep =
    step === STEPS.length - 1;


  // -------------------------------------------------------
  // Next
  // -------------------------------------------------------

  const goNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      setStep(
        s => s + 1
      );

      setAnimKey(
        k => k + 1
      );
    }
  };


  // -------------------------------------------------------
  // Back
  // -------------------------------------------------------

  const goBack = () => {
    if (step > 0) {
      setStep(
        s => s - 1
      );

      setAnimKey(
        k => k + 1
      );
    }
  };


  // -------------------------------------------------------
  // Check required field
  // -------------------------------------------------------

  const isAnswered = () => {
    if (
      current.type === "select"
    ) {
      return (
        formData[current.key] !== "" &&
        formData[current.key] != null
      );
    }


    if (
      current.type === "city"
    ) {
      return (
        formData[current.key]
          ?.trim()
          .length > 0
      );
    }


    return true;
  };


  // -------------------------------------------------------
  // Select normal option
  // -------------------------------------------------------

  const selectOption =
    (value) => {
      setFormData(
        prev => ({
          ...prev,
          [current.key]: value
        })
      );
    };


  // -------------------------------------------------------
  // Toggle multi-select
  // -------------------------------------------------------

  const toggleMultiOption =
    (option) => {

      setFormData(prev => {

        const list =
          prev[current.key];

        const updated =
          list.includes(option)
            ? list.filter(
                item =>
                  item !== option
              )
            : [
                ...list,
                option
              ];

        return {
          ...prev,
          [current.key]:
            updated
        };
      });
    };


  // -------------------------------------------------------
  // Boolean
  // -------------------------------------------------------

  const setBoolean =
    (value) => {

      setFormData(
        prev => ({
          ...prev,
          [current.key]: value
        })
      );
    };


  // -------------------------------------------------------
  // City value
  // -------------------------------------------------------

  const setCityValue = (value) => {
  setFormData((prev) => ({
    ...prev,
    origin_city: value,
    }));
  };


  // -------------------------------------------------------
  // Submit
  // -------------------------------------------------------

  const handleSubmit =
    async () => {

      setLoading(true);
      setError(null);

      try {

        const payload = {
          ...formData,
          days:
            Number(formData.days)
        };


        console.log(
          "Sending itinerary payload:",
          payload
        );


        const response =
          await axios.post(
            API_URL,
            payload
          );


        setResult(
          response.data
        );

      } catch (err) {

        console.error(
          "Itinerary generation failed:",
          err
        );


        const message =
          err.response?.data?.message ||
          "Something went wrong. Please check if the server is running.";


        setError(message);

      } finally {
        setLoading(false);
      }
    };


  // -------------------------------------------------------
  // Start over
  // -------------------------------------------------------

  const startOver = () => {

    setResult(null);

    setError(null);

    setFormData({
      ...DEFAULTS,
      group_composition: []
    });

    setStep(0);

    setAnimKey(
      k => k + 1
    );
  };


  const progressPercent =
    ((step + 1) /
      STEPS.length) *
    100;


  // -------------------------------------------------------
  // Result
  // -------------------------------------------------------

  if (result) {
    return (
      <div className="app-container">

        <ItineraryResult
          data={result}
          onStartOver={startOver}
        />

      </div>
    );
  }


  // -------------------------------------------------------
  // Loading
  // -------------------------------------------------------

  if (loading) {
    return (
      <div className="app-container">

        <div className="card loading-card">

          <div className="spinner"></div>

          <h2>
            Building your perfect itinerary...
          </h2>

          <p className="submitted-text">
            Finding the best places and
            optimizing your travel route.
          </p>

        </div>

      </div>
    );
  }


  // -------------------------------------------------------
  // Main form
  // -------------------------------------------------------

  return (
    <div className="app-container">

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width:
              `${progressPercent}%`
          }}
        />
      </div>


      <p className="step-counter">
        Question {step + 1} of{" "}
        {STEPS.length}
      </p>


      <div
        className="card fade-in"
        key={animKey}
      >

        <h2 className="question-text">
          {current.question}
        </h2>


        {error && (
          <p className="error-banner">
            {error}
          </p>
        )}


        {/* SELECT */}

        {current.type === "select" && (
          <div className="options-grid">

            {current.options.map(
              opt => (

                <button
                  key={opt}
                  type="button"

                  className={
                    `option-card ${
                      formData[current.key] === opt
                        ? "option-selected"
                        : ""
                    }`
                  }

                  onClick={() =>
                    selectOption(opt)
                  }
                >

                  {
                    typeof opt === "number"
                      ? `${opt} ${
                          opt === 1
                            ? "Day"
                            : "Days"
                        }`
                      : opt
                  }

                </button>
              )
            )}

          </div>
        )}


        {/* MULTI SELECT */}

        {current.type === "multiselect" && (
          <div className="options-grid">

            {current.options.map(
              opt => (

                <button
                  key={opt}
                  type="button"

                  className={
                    `option-card ${
                      formData[current.key]
                        .includes(opt)
                        ? "option-selected"
                        : ""
                    }`
                  }

                  onClick={() =>
                    toggleMultiOption(opt)
                  }
                >
                  {opt}
                </button>

              )
            )}

          </div>
        )}


        {/* BOOLEAN */}

        {current.type === "boolean" && (
          <div className="yesno-grid">

            <button
              type="button"

              className={
                `yesno-btn yes-btn ${
                  formData[current.key] === true
                    ? "option-selected"
                    : ""
                }`
              }

              onClick={() =>
                setBoolean(true)
              }
            >
              ✓ Yes
            </button>


            <button
              type="button"

              className={
                `yesno-btn no-btn ${
                  formData[current.key] === false
                    ? "option-selected"
                    : ""
                }`
              }

              onClick={() =>
                setBoolean(false)
              }
            >
              ✕ No
            </button>

          </div>
        )}


        {/* CITY AUTOCOMPLETE */}

        {current.type === "city" && (
          <div
            style={{
              marginBottom:
                "24px"
            }}
          >

            <CityAutocomplete
              value={
                formData.origin_city
              }

              onChange={
                setCityValue
              }
            />

            <p
              className="autocomplete-hint"
              style={{
                marginTop:
                  "8px"
              }}
            >
              This helps us estimate your
              travel cost to the destination.
            </p>

          </div>
        )}


        {/* NAVIGATION */}

        <div className="nav-row">

          <button
            type="button"
            className="ghost-btn"

            onClick={goBack}

            disabled={
              step === 0
            }
          >
            ← Back
          </button>


          {!current.required && (
            <button
              type="button"
              className="ghost-btn"

              onClick={goNext}
            >
              Skip
            </button>
          )}


          <button
            type="button"
            className="primary-btn"

            onClick={goNext}

            disabled={
              current.required &&
              !isAnswered()
            }
          >
            {
              isLastStep
                ? "Generate Plan 🚀"
                : "Next →"
            }
          </button>

        </div>

      </div>

    </div>
  );
}


export default App;