import React, { useState, useEffect } from "react";
import "../styles/Test.css";
import components from "./components";
import { useLocation } from "react-router-dom";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
const { Modal, fileUpload, handleApiCall, DataTableSection } = components;

const Test = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOptions, setModalOptions] = useState();
  const [testId, setTestId] = useState("");
  const [testName, setTestName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState("");
  const [attempts, setAttempts] = useState("");

  const [selectedUsersGroups, setSelectedUsersGroups] = useState([]);
  const [selectedQuestionsGroups, setSelectedQuestionsGroups] = useState([]);
  const [testResult, setTestResult] = useState([]);
  const [isUsersDropdownVisible, setUsersIsDropdownVisible] = useState(false);
  const [isQuestionsDropdownVisible, setIsQuestionsDropdownVisible] =
    useState(false);
  const [allUsersGroups, setAllUsersGroups] = useState([]);
  const [allQuestionsGroups, setAllQuestionsGroups] = useState([]);

  const [isTableDropdownVisible, setTableIsDropdownVisible] = useState(false);
  const [tableName, setTableName] = useState("Users");

  const [usersTableColumns, setUsersTableColumns] = useState([]);
  const [usersTableData, setUsersTableData] = useState([]);

  const [questionsTableColumns, setQuestionsTableColumns] = useState([]);
  const [questionsTableData, setQuestionsTableData] = useState([]);

  const [tableData, setTableData] = useState([""]);
  const [tableColumns, setTableColumns] = useState([""]);

  const [isAnswersModalOpen, setIsAnswersModalOpen] = useState(false);
  const [displayAnswer, setDisplayAnswer] = useState("");
  // eslint-disable-next-line no-unused-vars
  const [searchText, setSearchText] = useState("");
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get("id");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await handleApiCall({
          API: "find-data",
          data: {
            collection: "Tests",
            condition: { key: "_id", value: id },
          },
        });

        if (response.flag) {
          const responseData = response.data.data;
          setTestId(responseData._id);
          setSelectedUsersGroups(responseData["Participants Group"] || []);
          setSelectedQuestionsGroups(responseData["Questions Group"] || []);
          setTestName(responseData["Test Name"]);
          setStartTime(responseData["Start Time"]);
          setEndTime(responseData["End Time"]);
          setDuration(responseData.Duration);
          setAttempts(responseData["Attempts Limit"]);
          setTestResult(responseData["Test Results"]);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        const response = await handleApiCall({
          API: "load-data",
          data: { collection: "Users" },
        });

        if (response.flag) {
          const uniqueGroups = Array.from(
            new Set(response.data.data.map((user) => user.Group))
          ).filter((group) => !selectedUsersGroups.includes(group));
          const data =
            response.data.data?.filter((value) => !("title" in value)) || [];
          const studentData = data.find(
            (value) => value.userType === "Student"
          );
          setUsersTableColumns(Object.keys(studentData || data[0]));
          setUsersTableData(data);
          setAllUsersGroups(uniqueGroups);
          const matchedItems = testResult.map((testItem) => {
            return data.find((value) => value._id === testItem.UserID);
          });

          const uniqueItems = new Set(
            matchedItems.map((item) => item && JSON.stringify(item))
          );

          const uniqueItemsArray = Array.from(uniqueItems).map(
            (item) => item && JSON.parse(item)
          );

          const updatedTestResult = testResult.map((testItem, index) => {
            const matchedItem = uniqueItemsArray.find(
              (item) => item && item._id === testItem.UserID
            );

            delete testItem["UserID"];
            if (matchedItem) {
              testItem.Answer = JSON.parse(testItem.Answer);

              const totalQuestions = testItem["Answer"].length;
              const answers = Object.values(testItem.Answer);
              try {
                var answeredQuestions = answers.filter(
                  (answer) => answer !== "not-answered" && answer !== "skipped"
                ).length;
                var skipped = answers.filter((answer) =>
                  answer.includes("skipped")
                ).length;
                var notAnswered = answers.filter(
                  (answer) => answer === "not-answered"
                ).length;
              } catch (error) {}

              return {
                SNo: index + 1,
                Name: matchedItem.Name,
                "Roll No": matchedItem["Roll No"],
                Department: matchedItem.Department,
                "Total Questions": totalQuestions || 0,
                "Answered Questions": answeredQuestions || 0,
                Skipped: skipped || 0,
                "Not Answered": notAnswered || 0,
                ...testItem,
                answersObj: answers,
                Answers: showAnswers(index),
              };
            }

            return testItem;
          });

          setTestResult(updatedTestResult);
        }
      } catch (error) {
        console.log(error);
      }
    };

    if (selectedUsersGroups.length > 0) {
      fetchUsersData();
    } // eslint-disable-next-line
  }, [selectedUsersGroups]);
  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        const response = await handleApiCall({
          API: "load-data",
          data: { collection: "Questions" },
        });

        if (response.flag) {
          const uniqueGroups = Array.from(
            new Set(response.data.data.map((question) => question.Group))
          ).filter((group) => !selectedUsersGroups.includes(group));
          const data = response.data.data;
          setQuestionsTableColumns(Object.keys(data[0]));
          setQuestionsTableData(data);

          setAllQuestionsGroups(uniqueGroups);
        }
      } catch (error) {
        console.log(error);
      }
    };

    if (selectedUsersGroups.length > 0) {
      fetchUsersData();
    }
  }, [selectedUsersGroups]);

  const showModal = (type, message, buttons, responseFunc) => {
    setModalOptions({ type, message, buttons, responseFunc });
    setIsModalOpen(true);
  };

  const addGroup = (
    group,
    selectedGroups,
    setSelectedGroups,
    allGroups,
    setAllGroups
  ) => {
    if (group === "No Groups Available") {
      setUsersIsDropdownVisible(false);
      setIsQuestionsDropdownVisible(false);
      return;
    }
    if (!selectedGroups.includes(group)) {
      setSelectedGroups([...selectedGroups, group]);
      setAllGroups(allGroups.filter((g) => g !== group));
      setIsQuestionsDropdownVisible(false);
      setUsersIsDropdownVisible(false);
    }
  };

  const removeGroup = (
    group,
    selectedGroups,
    setSelectedGroups,
    allGroups,
    setAllGroups
  ) => {
    setSelectedGroups(selectedGroups.filter((selected) => selected !== group));
    setAllGroups([...allGroups, group]);
  };

  const handleClickOutside = (e) => {
    const dropdown = document.querySelector(".group-dropdown");
    if (dropdown && !dropdown.contains(e.target)) {
      setIsQuestionsDropdownVisible(false);
      setUsersIsDropdownVisible(false);
      setTableIsDropdownVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!testName) {
      showModal("Error", "Please fill in all required fields.", ["Ok"]);
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      showModal("Error", "End time must be greater than start time.", ["Ok"]);
      return;
    }

    const files = document.querySelectorAll("input[type=file]");

    fileUpload(
      () => {},
      files[0],
      "Upload-question",
      "Questions",
      showModal,
      setIsModalOpen
    );

    try {
      let configurations = {};

      if (testName) configurations["Test Name"] = testName;
      if (startTime) configurations["Start Time"] = startTime;
      if (endTime) configurations["End Time"] = endTime;
      if (duration) configurations["Duration"] = duration;
      if (attempts) configurations["Attempts Limit"] = attempts;

      if (
        Array.isArray(selectedUsersGroups) &&
        selectedUsersGroups.length > 0
      ) {
        configurations["Participants Group"] = selectedUsersGroups;
      }

      if (
        Array.isArray(selectedQuestionsGroups) &&
        selectedQuestionsGroups.length > 0
      ) {
        configurations["Questions Group"] = selectedQuestionsGroups;
      }

      if (!testName) {
        throw new Error("Test Name is required.");
      }

      const response = await handleApiCall({
        API: "update-data",
        data: {
          condition: { _id: testId },
          collection: "Tests",
          data: configurations,
        },
      });

      if (response.flag) {
        showModal("Success", "Test Updated Successfully", ["Ok"]);
      } else {
        showModal("Error", response.error, ["Close"]);
      }
    } catch (error) {
      showModal("Uncaught Error", error.message, ["Close"]);
    }
  };
  const showAnswers = (index) => {
    return (
      <button
        onClick={() => {
          setIsAnswersModalOpen(true);
          setDisplayAnswer([index]);
        }}
      >
        View
      </button>
    );
  };
  const displayUsersGroups =
    allUsersGroups.length === 0 ? ["No Groups Available"] : allUsersGroups;
  const displayQuestionsGroups =
    allQuestionsGroups.length === 0
      ? ["No Groups Available"]
      : allQuestionsGroups;

  useEffect(() => {
    const testResultData = [...testResult];

    const columns =
      tableName === "Users"
        ? [
            {
              name: "S.No",
              selector: (row, index) => index + 1,
              sortable: true,
              width: "70px",
            },
            ...usersTableColumns
              .filter(
                (column) =>
                  column !== "Password" &&
                  column !== "userType" &&
                  column !== "_id" &&
                  column !== "Group"
              )
              .map((column) => ({
                name: column,
                selector: (row) => row[column],
                sortable: true,
                wrap: true,
                padding: "10px",
              })),
          ]
        : tableName === "Questions"
        ? [
            {
              name: "SNo",
              selector: (row, index) => index + 1,
              sortable: true,
              width: "70px",
            },
            ...questionsTableColumns
              .filter((column) => column !== "Group" && column !== "_id")
              .map((column) => ({
                name: column,
                selector: (row) => row[column],
                sortable: true,
                wrap: true,
                padding: "10px",
              })),
          ]
        : testResultData.length > 0
        ? [
            {
              name: "SNo",
              selector: (row, index) => index + 1,
              sortable: true,
              width: "70px",
            },
            ...Object.keys(testResultData[0])
              .filter(
                (column) => column !== "answersObj" && column !== "Answer"
              )
              .map((column) => ({
                name: column,
                selector: (row) => row[column],
                sortable: true,
                wrap: true,
              }))
              .slice(1),
          ]
        : [];

    const data =
      tableName === "Users"
        ? usersTableData.filter(
            (user) =>
              user.userType !== "Admin" &&
              selectedUsersGroups.includes(user.Group)
          )
        : tableName === "Questions"
        ? questionsTableData.filter((question) =>
            selectedQuestionsGroups.includes(question.Group)
          )
        : testResult
        ? testResult
        : [];

    setTableColumns(columns);
    setTableData(data);
  }, [
    tableName,
    selectedUsersGroups,
    selectedQuestionsGroups,
    usersTableData,
    usersTableColumns,
    questionsTableColumns,
    questionsTableData,
    testResult,
  ]);
  const generateReport = () => {
    const doc = new jsPDF({ orientation: "landscape" });

    const tableHead = [
      [
        ...tableColumns
          .filter((column) => column.name !== "Answer")
          .map((column) => column.name),
      ],
    ];

    const tableBody = tableData.map((row, index) => {
      const filteredRow = { ...row };
      delete filteredRow.Answer;

      return [
        ...tableColumns
          .filter((column) => column.name !== "Answer")
          .map((column) => filteredRow[column.name]),
      ];
    });

    doc.setFontSize(18);
    doc.text(testName + " Report", 14, 22);

    doc.autoTable({
      head: tableHead,
      body: tableBody,
      startY: 30,
    });

    doc.save(testName + " report.pdf");
  };
  const handleNavigate = (navigateTo) => {
    if (navigateTo === "Previous") {
      setDisplayAnswer([displayAnswer[0] - 1]);
    } else {
      setDisplayAnswer([displayAnswer[0] + 1]);
    }
  };
  // eslint-disable-next-line no-unused-vars
  const handleSearch = () => {
    console.log(searchText);
  };
  const AnswerCard = ({ question, index, questions, tr }) => {
    const questionText = Object.keys(question)[0];
    const userAnswer = Object.values(question)[0];

    const matchingOptions = questions
      .filter((q) => selectedQuestionsGroups.includes(q.Group))
      .find((option) => option.Question === questionText);

    const isParagraph = matchingOptions?.Option[0] === "Paragraph";

    return (
      <div className="answer-card">
        <h3 className="question-heading">
          Q {index + 1}: {questionText}
        </h3>
        <div className="answer-details">
          {matchingOptions && (
            <>
              {matchingOptions.Option && (
                <AnswerSection title="Options" items={matchingOptions.Option} />
              )}
              {matchingOptions.Answer && (
                <AnswerSection
                  title="Correct Answers"
                  items={matchingOptions.Answer}
                />
              )}
            </>
          )}

          {renderUserAnswer(userAnswer)}

          {isParagraph && (
            <input
              type="number"
              className="mark-input"
              placeholder="Enter marks"
            />
          )}
        </div>
      </div>
    );
  };

  const AnswerSection = ({ title, items }) => (
    <div key={title}>
      <h5>{title}</h5>
      <ul>
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );

  const renderUserAnswer = (userAnswer, renderInput = false) => {
    if (!userAnswer) return null;

    return (
      <div>
        <h5>User's Answer</h5>
        {typeof userAnswer === "string" ? (
          <ul>
            <li>{userAnswer}</li>
          </ul>
        ) : Array.isArray(userAnswer) ? (
          <ul>
            {userAnswer.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        ) : null}

        {renderInput && (
          <>
            <input
              type="number"
              className="mark-input"
              placeholder="Enter marks"
            />
            <button className="btn btn-primary">Submit</button>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {isModalOpen && (
        <Modal
          modalType={modalOptions?.type || "Info"}
          modalMessage={
            modalOptions?.message || "An unexpected issue occurred."
          }
          buttons={modalOptions?.buttons || ["Ok"]}
          response={modalOptions?.responseFunc || (() => setIsModalOpen(false))}
        />
      )}
      {isAnswersModalOpen && displayAnswer && (
        <div className="answers-modal">
          <div className="actions-div">
            <div className="user-details">
              <h3>Name: {testResult[displayAnswer[0]]?.Name}</h3>
              <h3>Roll No: {testResult[displayAnswer[0]]?.["Roll No"]}</h3>
              <h3>Department: {testResult[displayAnswer[0]]?.Department}</h3>
              <h3>Score: {testResult[displayAnswer[0]]?.Score}</h3>
            </div>
            <div className="buttons-div">
              {/*<input
                type="text"
                className="search-input"
                onChange={(e) => {
                  setSearchText(e.target.value);
                }}
                placeholder="Search"
              />
              <button type="button" onClick={handleSearch}>
                Search
              </button>*/}
              {displayAnswer && testResult.length > 0 && (
                <>
                  {displayAnswer[0] > 0 && (
                    <button
                      key={"Previous"}
                      onClick={() => handleNavigate("Previous")}
                      type="button"
                    >
                      Previous
                    </button>
                  )}

                  {displayAnswer[0] < testResult.length - 1 && (
                    <button
                      key={"Next"}
                      onClick={() => handleNavigate("Next")}
                      type="button"
                    >
                      Next
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <h1 className="answers-heading">Answers Details</h1>

          <div className="answers-content">
            {testResult[displayAnswer[0]]?.answersObj &&
              testResult[displayAnswer[0]]?.answersObj.map(
                (question, index) => (
                  <AnswerCard
                    key={Object.keys(question)[0]}
                    question={question}
                    tr={testResult[displayAnswer[0]]}
                    index={index}
                    questions={questionsTableData}
                  />
                )
              )}
          </div>
        </div>
      )}

      <div style={{ display: "flex" }}>
        <form
          className="test-form"
          onSubmit={handleSubmit}
          style={{ margin: " 20px " }}
        >
          <h1 className="card-header" style={{ margin: "0" }}>
            {testName}
          </h1>
          <div className="form-group">
            <label>Test Name *</label>
            <input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Start Date and Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onFocus={(e) => e.target.showPicker()}
              onChange={(e) => setStartTime(e.target.value)}
              className="datetime-input"
            />
          </div>

          <div className="form-group">
            <label>End Date and Time </label>
            <input
              type="datetime-local"
              value={endTime}
              onFocus={(e) => e.target.showPicker()}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Duration (HH:MM:SS)</label>
            <input
              type="time"
              onClick={(e) => e.target.showPicker()}
              step={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Attempts Limit</label>
            <input
              type="number"
              value={attempts}
              onChange={(e) => setAttempts(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Participants Group</label>
            <div className="group-selector">
              <input
                type="text"
                className="group-selector-input"
                value={selectedUsersGroups.join(", ") || "Select Groups"}
                onFocus={() => setUsersIsDropdownVisible(true)}
                readOnly
              />

              {isUsersDropdownVisible && (
                <div className="group-dropdown">
                  {displayUsersGroups.map((group) => (
                    <div
                      key={group}
                      className="group-item"
                      onClick={() =>
                        addGroup(
                          group,
                          selectedUsersGroups,
                          setSelectedUsersGroups,
                          allUsersGroups,
                          setAllUsersGroups
                        )
                      }
                    >
                      <span>{group}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="selected-groups">
              {selectedUsersGroups.map((group) => (
                <span key={group} className="selected-group">
                  {group}{" "}
                  <button
                    onClick={() =>
                      removeGroup(
                        group,
                        selectedUsersGroups,
                        setSelectedUsersGroups,
                        allUsersGroups,
                        setAllUsersGroups
                      )
                    }
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>Questions Group</label>
            <div className="group-selector">
              <input
                type="text"
                className="group-selector-input"
                value={selectedQuestionsGroups.join(", ") || "Select Groups"}
                onFocus={() => setIsQuestionsDropdownVisible(true)}
                readOnly
              />

              {isQuestionsDropdownVisible && (
                <div className="group-dropdown">
                  {displayQuestionsGroups.map((group) => (
                    <div
                      key={group}
                      className="group-item"
                      onClick={() =>
                        addGroup(
                          group,
                          selectedQuestionsGroups,
                          setSelectedQuestionsGroups,
                          allQuestionsGroups,
                          setAllQuestionsGroups
                        )
                      }
                    >
                      <span>{group}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="selected-groups">
              {selectedQuestionsGroups.map((group) => (
                <span key={group} className="selected-group">
                  {group}{" "}
                  <button
                    onClick={() =>
                      removeGroup(
                        group,
                        selectedQuestionsGroups,
                        setSelectedQuestionsGroups,
                        allQuestionsGroups,
                        setAllQuestionsGroups
                      )
                    }
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          </div>
          {/*<div className="form-group">
            <label>Upload New Group</label>
            <input type="file" name="users-group-file" />
          </div>*/}

          <div className="form-group">
            <label>Upload Questions</label>
            <input type="file" name="questions-group-file" />
          </div>

          <button type="submit">Submit</button>
        </form>
        <div>
          <div style={{ margin: "20px" }}>
            <div className="form-group">
              <label>Select Data to Show</label>
              <div className="group-selector">
                <input
                  style={{ marginRight: "10px" }}
                  type="text"
                  className="group-selector-input"
                  value={tableName}
                  onFocus={() => setTableIsDropdownVisible(true)}
                  readOnly
                />
                {tableName === "Test Results" && testResult.length > 0 && (
                  <button onClick={generateReport}>Generate Report</button>
                )}
                {isTableDropdownVisible && (
                  <div className="group-dropdown">
                    {["Users", "Questions", "Test Results"].map((group) => (
                      <div
                        key={group}
                        className="group-item"
                        onClick={(e) => {
                          setTableName(e.target.innerText);
                          setTableIsDropdownVisible(false);
                        }}
                      >
                        <span>{group}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div
            className="data-table"
            style={{ marginTop: "25px", border: "1px solid #007bff" }}
          >
            {tableColumns && tableData && (
              <DataTableSection columns={tableColumns} data={tableData} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Test;
