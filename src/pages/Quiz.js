import React, { useState, useEffect } from "react";

import { CgProfile } from "react-icons/cg";

import "../styles/Quiz.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Quiz = (props) => {
  const { initialTime } = props;
  const [userData, setUserData] = useState();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [totalTime] = useState(initialTime);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [highlightedOptions, setHighlightedOptions] = useState([]);

  const [hosts, setHosts] = useState([]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}"),
      localIps = localStorage.getItem("localIps");
    userData && setUserData(userData);

    if (localIps) {
      setHosts(JSON.parse(localIps));
    }
  }, [props]);

  useEffect(() => {
    hosts.length &&
      axios
        .post(`http://${hosts[0]}:5000/load-data`, { collection: "Tests" })
        .then((result) => {
          result.data.forEach((qn) => {
            delete qn["_id"];
          });
          const questionsObj = result.data.map((question) => {
            return {
              ...question,
              type: question.Answer.length > 1 ? "checkbox" : "radio", // Multiple answers => checkbox, single answer => radio
            };
          });
          setQuestions(questionsObj);
        });
  }, [hosts]);

  useEffect(() => {
    if (questions.length) {
      const intTimer = setInterval(() => {
        setTimeLeft((prevTimeLeft) => {
          prevTimeLeft = prevTimeLeft - 1;
          if (prevTimeLeft <= 2) {
            clearInterval(intTimer);
            return 0;
          }
          return prevTimeLeft;
        });

        return () => clearInterval(intTimer);
      }, 1000);
    }
  }, [questions]);

  const totalQuestions = questions.length;

  const handleOptionSelect = (option, type) => {
    const updatedSelections = [...highlightedOptions];

    if (type === "radio") {
      // Toggle selection for radio buttons
      if (updatedSelections[currentQuestionIndex] === option) {
        updatedSelections[currentQuestionIndex] = "not-answered"; // Deselect if clicked again
      } else {
        updatedSelections[currentQuestionIndex] =
          option !== undefined ? option : "not-answered";
      }
    } else if (type === "checkbox") {
      const currentSelections = updatedSelections[currentQuestionIndex] || [];

      // Toggle checkbox selection
      if (currentSelections.includes(option)) {
        updatedSelections[currentQuestionIndex] = currentSelections.filter(
          (o) => o !== option
        );
      } else {
        updatedSelections[currentQuestionIndex] = [
          ...currentSelections,
          option,
        ];
      }

      // Check if any selections are made
      if (updatedSelections[currentQuestionIndex].length === 0) {
        updatedSelections[currentQuestionIndex] = "not-answered"; // Mark as not-answered
      } else if (
        updatedSelections[currentQuestionIndex] === "not-answered" ||
        updatedSelections[currentQuestionIndex] === "skipped"
      ) {
        updatedSelections[currentQuestionIndex] = []; // Clear "not-answered" status
      }
    }

    // Update states
    setHighlightedOptions(updatedSelections);
    setSelectedOptions(updatedSelections);
  };

  const handleNextQuestion = () => {
    const updatedSelections = [...highlightedOptions];

    // If no option is selected, mark as 'not-answered'
    if (updatedSelections[currentQuestionIndex] === undefined) {
      updatedSelections[currentQuestionIndex] = "not-answered";
    }

    setHighlightedOptions(updatedSelections);
    setSelectedOptions(updatedSelections);

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    const updatedSelections = [...highlightedOptions];

    if (updatedSelections[currentQuestionIndex] === undefined) {
      updatedSelections[currentQuestionIndex] = "not-answered";
    }

    setHighlightedOptions(updatedSelections);
    setSelectedOptions(updatedSelections);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSkip = () => {
    const updatedSelections = [...highlightedOptions];

    updatedSelections[currentQuestionIndex] = "skipped";

    setHighlightedOptions(updatedSelections);

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  const handleQuestionClick = (index) => {
    const updatedSelections = [...highlightedOptions];

    // If the question is neither answered nor skipped, mark it as not-answered
    if (updatedSelections[index] === undefined) {
      updatedSelections[index] = "not-answered";
    }

    setHighlightedOptions(updatedSelections);
    setCurrentQuestionIndex(index);
  };

  const handleSubmit = () => {
    if (window.confirm("Are you sure you want to start the test?")) {
      console.log("Quiz Submitted:", selectedOptions);
      alert("Quiz Submitted!");
      navigate("/");
    }
  };
  const showProfile = (profileDetails) => {
    const isExist = document.querySelector(".profile-container");
    if (isExist) {
      return;
    }
    const profileContainer = document.createElement("div");
    profileContainer.className = "profile-container";
    const profileInfo = document.createElement("div");
    profileInfo.className = "profile-info";
    Object.keys(profileDetails).map(async (detail) => {
      const detailList = document.createElement("li");
      detailList.classList = "detail";
      detailList.innerHTML = `<p><span>${detail}:</span>&nbsp;<span> ${profileDetails[detail]}</span></p>`;
      profileInfo.appendChild(detailList);
    });
    profileContainer.appendChild(profileInfo);
    document.body.appendChild(profileContainer);
  };

  useEffect(() => {
    const bodyClick = (event) => {
      if (event.target.closest("li.profile")) {
        return;
      } else if (event.target.closest("div.profile-container")) {
        return;
      }

      const profileExist = document.querySelector(".profile-container");

      if (profileExist) {
        profileExist.remove();
      }
    };
    document.body.addEventListener("click", bodyClick);
    return () => {
      document.body.removeEventListener("click", bodyClick);
    };
  }, []);

  const currentQuestion = questions[currentQuestionIndex];
  const selectedOption = highlightedOptions[currentQuestionIndex] || [];

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  //const element = <FontAwesomeIcon icon={byPrefixAndName.fas["house"]} />;
  return (
    <>
      {/* Top Navigation Bar */}
      <div>
        <nav className="navbar">
          <div className="logo">Quizzards</div>
          <div className="nav-links">
            {/*{console.log(questions)}*/}
            <span
              onClick={() => {
                navigate("/admin");
              }}
            >
              Home
            </span>
            <a href="#about">About</a>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://sanjaikumaran.online/contact/"
            >
              Contact
            </a>{" "}
            <li
              onClick={() => {
                showProfile(userData);
              }}
              className="profile"
            >
              {<CgProfile style={{ fontSize: "1.5rem" }} />}
            </li>
          </div>
        </nav>
      </div>

      <div className="quiz-body">
        <div className="quiz-app">
          <div className="quiz-content">
            <div className="question-section">
              <h1>{currentQuestion?.Question}</h1>
              <ul className="options">
                {currentQuestion?.Option.map((option, index) => (
                  <li
                    key={index}
                    onClick={() =>
                      handleOptionSelect(option, currentQuestion.type)
                    }
                    className={`
                option 
                ${
                  currentQuestion.type === "radio" && selectedOption === option
                    ? "selected"
                    : ""
                }
                ${
                  currentQuestion.type === "checkbox" &&
                  selectedOption.includes(option)
                    ? "selected"
                    : ""
                }
            `}
                  >
                    {currentQuestion?.type === "radio" ? (
                      <label>
                        <input
                          type="radio"
                          name={`question-${currentQuestionIndex}`}
                          value={option}
                          checked={selectedOption === option} // Will reflect deselection
                          onChange={() => handleOptionSelect(option, "radio")}
                        />
                        {option}
                      </label>
                    ) : (
                      <label>
                        <input
                          type="checkbox"
                          name={`question-${currentQuestionIndex}`}
                          value={option}
                          checked={selectedOption.includes(option)}
                          onChange={() =>
                            handleOptionSelect(option, "checkbox")
                          }
                        />
                        {option}
                      </label>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="footer">
            {currentQuestionIndex !== 0 ? (
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </button>
            ) : (
              ""
            )}
            <button
              onClick={
                currentQuestionIndex !== totalQuestions - 1
                  ? handleNextQuestion
                  : handleSubmit
              }
              className={
                currentQuestionIndex !== totalQuestions - 1
                  ? ""
                  : "submit-button"
              }
            >
              {currentQuestionIndex !== totalQuestions - 1 ? "Next" : "Submit"}
            </button>
            {currentQuestionIndex !== totalQuestions - 1 && (
              <button onClick={handleSkip}>Skip</button>
            )}

            <p>
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </p>
          </div>
        </div>
        <div>
          {/* Timer Section */}
          <div className="timer-section">
            <h1 className="header">Timer</h1>
            <div className="timer-container">
              <div className="timer-circle">
                <svg width="120" height="120">
                  <circle
                    r={radius}
                    cx="60"
                    cy="60"
                    fill="none"
                    stroke="#e7e7e7"
                    strokeWidth="8"
                  ></circle>
                  <circle
                    r={radius}
                    cx="60"
                    cy="60"
                    fill="none"
                    stroke="#007BFF"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={
                      circumference - (timeLeft / totalTime) * circumference
                    }
                    style={{
                      transition: "stroke-dashoffset 1s linear",
                    }}
                  ></circle>
                </svg>
                <div className="timer-text">
                  {Math.floor(timeLeft / 60)}m {timeLeft % 60}s
                </div>
              </div>
              <div>Time Remaining</div>
            </div>
          </div>

          {/* Question Number Section */}
          <div className="question-number-container">
            <h1 className="header">Questions List</h1>
            <div className="grid-layout">
              {Array.from({ length: totalQuestions }, (_, i) => (
                <div
                  className={`question-number ${
                    i === currentQuestionIndex ? "current-question" : ""
                  } ${
                    highlightedOptions[i] === "skipped"
                      ? "skipped"
                      : highlightedOptions[i] === "not-answered"
                      ? "not-answered"
                      : highlightedOptions[i] !== undefined
                      ? "answered"
                      : ""
                  }`}
                  key={i + 1}
                  onClick={() => handleQuestionClick(i)} // Handle question click
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Quiz;
