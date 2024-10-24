import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import Quiz from "./pages/Quiz";
import Instructions from "./pages/Instructions";
import Signin from "./pages/Signin";
import Admin from "./pages/Admin";
import Students from "./pages/Students";
import Tests from "./pages/Tests";

const App = () => {
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch local IP addresses
        const response = await fetch(`http://192.168.1.152:5000/data`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const result = await response.json();
        localStorage.setItem("localIps", JSON.stringify(result));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    // Fetch local IPs when component mounts
    fetchData();
  }, []); // Empty dependency array ensures this runs only once
  const apiUrl = process.env.REACT_APP_API_URL;
  const otherVar = process.env.REACT_APP_OTHER_VAR;
  console.log(process.env);

  console.log("API URL:", apiUrl); // This should print the value from .env
  console.log("Other Var:", otherVar);

  const initialTime = 100;
  const questions = [
    {
      question: "Which of the following are fruits?",
      type: "checkbox",
      options: ["Apple", "Carrot", "Banana", "Broccoli"],
    },
    {
      question: "What is the capital of France?",
      type: "radio",
      options: ["Berlin", "Madrid", "Paris", "Rome"],
    },
  ];

  const instructions = [
    "Instruction 1: Please read carefully.",
    "Instruction 2: Choose the correct answers.",
    "Instruction 3: Time limit is 10 minutes.",
  ];

  return (
    <Router>
      <Routes>
        <Route
          index
          element={
            <>
              <ChangeTitle title="Home" />
              <Signin />
            </>
          }
        />
        <Route
          path="/instructions"
          element={
            <>
              <ChangeTitle title="Instructions" />
              <Instructions instructions={instructions} />
            </>
          }
        />
        <Route
          path="/quiz"
          element={
            <>
              <ChangeTitle title="Quiz" />
              <Quiz initialTime={initialTime} questions={questions} />
            </>
          }
        />
        <Route
          path="/admin"
          element={
            <>
              <ChangeTitle title="Admin" />
              <Admin initialTime={initialTime} />
            </>
          }
        />
        <Route
          path="/students-module"
          element={
            <>
              <ChangeTitle title="Students Module" />
              <Students />
            </>
          }
        />{" "}
        <Route
          path="/test-module"
          element={
            <>
              <ChangeTitle title="Test Module" />
              <Tests />
            </>
          }
        />
      </Routes>
    </Router>
  );
};

const ChangeTitle = ({ title }) => {
  useEffect(() => {
    document.title = title;
  }, [title]);
  return null;
};

export default App;
