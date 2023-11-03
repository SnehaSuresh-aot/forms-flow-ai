import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Drawer from "@material-ui/core/Drawer";
import List from "@material-ui/core/List";
import Divider from "@material-ui/core/Divider";
import {
  deleteFilters,
  editFilters,
  fetchBPMTaskCount,
  fetchFilterList,
  fetchServiceTaskList,
  saveFilters,
} from "../../../../apiManager/services/bpmTaskServices";
import {
  ACCESSIBLE_FOR_ALL_GROUPS,
  PRIVATE_ONLY_YOU,
  SPECIFIC_USER_OR_GROUP,
} from "../../../../constants/taskConstants";
import { useTranslation } from "react-i18next";
import { Translation } from "react-i18next";
import {
  setBPMFilterLoader,
  setBPMFiltersAndCount,
  setSelectedBPMFilter,
} from "../../../../actions/bpmTaskActions";

import TaskAttributeComponent from "./TaskAttributeComponent";
import { toast } from "react-toastify";
export default function CreateNewFilterDrawer({
  selectedFilterData,
  openFilterDrawer,
  setOpenFilterDrawer,
  setFilterSelectedForEdit,
}) {
  const dispatch = useDispatch();
  const userRole = useSelector(
    (state) => state.user?.userDetail?.preferred_username
  );
  const [filterName, setFilterName] = useState("");
  const [showUndefinedVariable, setShowUndefinedVariable] = useState(false);
  const [inputVisibility, setInputVisibility] = useState({});
  const [definitionKeyId, setDefinitionKeyId] = useState("");
  const [candidateGroup, setCandidateGroup] = useState([]);
  const [assignee, setAssignee] = useState("");
  const [includeAssignedTasks, setIncludeAssignedTasks] = useState(false);
  const [permissions, setPermissions] = useState("");
  const [identifierId, setIdentifierId] = useState("");
  const [selectUserGroupIcon, setSelectUserGroupIcon] = useState("");
  const [specificUserGroup, setSpecificUserGroup] = useState("");
  const firstResult = useSelector((state) => state.bpmTasks.firstResult);

  const userName = useSelector(
    (state) => state.user?.userDetail?.preferred_username
  );
  const selectedFilter = useSelector((state) => state.bpmTasks.selectedFilter);
  const filterList = useSelector((state) => state.bpmTasks.filterList);
  const [variables, setVariables] = useState([]);
  const [inputValues, setInputValues] = useState([{ name: "", label: "" }]);
  const { t } = useTranslation();
  const [modalShow, setModalShow] = useState(false);
  const [checkboxes, setCheckboxes] = useState({
    applicationId: true,
    assignee: true,
    taskTitle: true,
    createdDate: true,
    dueDate: true,
    followUp: true,
    priority: true,
    groups: true,
  });
  const taskAttributesCount = Object.values(checkboxes).filter(
    (value) => value === true
  ).length;
  const customTrim = (inputString) => {
    // Remove '%' symbol from the start
    const startIndex = inputString?.indexOf("%");
    if (startIndex === 0) {
      inputString = inputString?.substring(1);
    }

    // Remove '%' symbol from the end
    const endIndex = inputString?.lastIndexOf("%");
    if (endIndex === inputString?.length - 1) {
      inputString = inputString?.substring(0, endIndex);
    }
    return inputString;
  };

  useEffect(() => {
    if (selectedFilterData) {
      setFilterName(selectedFilterData?.name);
      let processDefinitionName =
        selectedFilterData?.criteria?.processDefinitionNameLike;
      setDefinitionKeyId(customTrim(processDefinitionName));
      setCandidateGroup(selectedFilterData?.criteria?.candidateGroup);
      setAssignee(selectedFilterData?.criteria?.assignee);
      setIncludeAssignedTasks(
        selectedFilterData?.criteria?.includeAssignedTasks
      );
      setShowUndefinedVariable(
        selectedFilterData?.properties?.showUndefinedVariable
      );
      if (selectedFilterData.variables) {
        setInputValues(() => {
          return selectedFilterData.variables?.map((row) => ({
            name: row.name,
            label: row.label,
          }));
        });
      }
      if (!selectedFilterData.variables?.length) {
        setInputValues([{ name: "", label: "" }]);
      }
      if (
        !selectedFilterData?.users?.length &&
        !selectedFilterData?.roles?.length
      ) {
        setSpecificUserGroup("");
        setPermissions(ACCESSIBLE_FOR_ALL_GROUPS);
      }
      const isUserInRoles = selectedFilterData?.users?.includes(userRole);
      if (isUserInRoles) {
        setPermissions(PRIVATE_ONLY_YOU);
      }
      if (selectedFilterData?.users?.length && !isUserInRoles) {
        setPermissions(SPECIFIC_USER_OR_GROUP);
        setSelectUserGroupIcon("user");
        setIdentifierId(selectedFilterData?.users[0]);
        setSpecificUserGroup(SPECIFIC_USER_OR_GROUP);
      }
      if (selectedFilterData?.roles?.length) {
        setPermissions(SPECIFIC_USER_OR_GROUP);
        setSelectUserGroupIcon("group");
        setIdentifierId(selectedFilterData?.roles[0]);
        setSpecificUserGroup(SPECIFIC_USER_OR_GROUP);
      }
      setCheckboxes({
        applicationId: selectedFilterData?.taskVisibleAttributes?.applicationId,
        assignee: selectedFilterData?.taskVisibleAttributes?.assignee,
        taskTitle: selectedFilterData?.taskVisibleAttributes?.taskTitle,
        createdDate: selectedFilterData?.taskVisibleAttributes?.createdDate,
        dueDate: selectedFilterData?.taskVisibleAttributes?.dueDate,
        followUp: selectedFilterData?.taskVisibleAttributes?.followUp,
        priority: selectedFilterData?.taskVisibleAttributes?.priority,
        groups: selectedFilterData?.taskVisibleAttributes?.groups,
      });
    }
  }, [selectedFilterData]);

  useEffect(() => {
    setVariables(() => {
      if (
        inputValues?.length === 1 &&
        inputValues[0]?.name === "" &&
        inputValues[0]?.label === ""
      ) {
        return [];
      } else {
        return inputValues?.map((row) => ({
          name: row.name,
          label: row.label,
        }));
      }
    });
  }, [inputValues]);

  const successCallBack = (resData) => {
    dispatch(
      fetchFilterList((err, data) => {
        if (data) {
          fetchBPMTaskCount(data)
            .then((res) => {
              dispatch(setBPMFiltersAndCount(res.data));
            })
            .catch((err) => {
              if (err) {
                console.error(err);
              }
            })
            .finally(() => {
              if (selectedFilterData) {
                const filterSelected = filterList?.find(
                  (filter) => filter.id === selectedFilterData?.id
                );
                if (selectedFilterData?.id === selectedFilter?.id) {
                  dispatch(fetchServiceTaskList(resData,null,firstResult));
                } else {
                  dispatch(setSelectedBPMFilter(filterSelected));
                }
                toast.success(t("Changes Applied Successfully"));
              }else{
                toast.success(t("Filter Created Successfully"));
              }
              dispatch(setBPMFilterLoader(false));
            });
        }
      })
    );
    toggleDrawer();
    clearAllFilters();
  };

  const clearAllFilters = () => {
    setFilterName("");
    setShowUndefinedVariable("");
    setInputVisibility("");
    setDefinitionKeyId("");
    setCandidateGroup("");
    setAssignee("");
    setIncludeAssignedTasks("");
    setPermissions("");
    setIdentifierId("");
    setSelectUserGroupIcon("");
    setSpecificUserGroup("");
    setInputValues([{ name: "", label: "" }]);
  };

  const handleSubmit = () => {
    let users = [];
    let roles = [];
    if (permissions === ACCESSIBLE_FOR_ALL_GROUPS) {
      users = [];
    }
    if (permissions === PRIVATE_ONLY_YOU) {
      users.push(userName);
    }
    if (
      selectUserGroupIcon === "user" &&
      permissions === SPECIFIC_USER_OR_GROUP
    ) {
      users.push(identifierId);
    }
    if (selectUserGroupIcon === "group") {
      roles.push(identifierId);
    }

    const data = {
      name: filterName,
      criteria: {
        processDefinitionNameLike: definitionKeyId && `%${definitionKeyId}%`,
        candidateGroup: candidateGroup,
        assignee: assignee,
        includeAssignedTasks: includeAssignedTasks,
      },
      properties: {
        showUndefinedVariable: showUndefinedVariable,
      },
      variables: variables,
      users: users,
      roles: roles,
      taskVisibleAttributes: { ...checkboxes },
    };

    // Remove empty keys inside criteria
    for (const key in data.criteria) {
      if (
        Object.prototype.hasOwnProperty.call(data.criteria, key) &&
        (data.criteria[key] === undefined || data.criteria[key] === "")
      ) {
        delete data.criteria[key];
      }
    }

    const submitFunction = selectedFilterData
      ? editFilters(data, selectedFilterData?.id)
      : saveFilters(data);
    submitFunction
      .then(() => successCallBack(data))
      .catch((error) => {
        toast.error(t("Filter Creation Failed"));
        console.error("error", error);
      });
  };

  const handleFilterDelete = () => {
    deleteFilters(selectedFilterData?.id)
      .then(() => {
        dispatch(fetchFilterList((err, data) => {
          if (data) {
            fetchBPMTaskCount(data)
              .then((res) => {
                dispatch(setBPMFiltersAndCount(res.data));
                dispatch(fetchServiceTaskList(data[0],null,firstResult));
              })
              .catch((err) => {
                if (err) {
                  console.error(err);
                }
              });
          }
          toast.success(t("Filter Deleted Successfully"));
        }));
      })

      .catch((error) => {
        toast.error(t("Filter Creation Failed"));
        console.error("error", error);
      });
  };

  // Function for setting visibility of input feild in criteria part
  const handleSpanClick = (spanId) => {
    setInputVisibility((prevVisibility) => ({
      ...prevVisibility,
      [spanId]: !prevVisibility[spanId],
    }));
  };

  //Function For checking  includeAssignedTasksCheckbox is checked or not
  const includeAssignedTasksCheckboxChange = (e) => {
    setIncludeAssignedTasks(e.target.checked);
  };

  //Function to checking which icon is selected
  const handleClickUserGroupIcon = (icon) => {
    setSelectUserGroupIcon(icon);
  };

  //function for taking the value from the radio button Specific User/ Group
  const handleSpecificUserGroup = (e) => {
    setPermissions(e.target.value);
    if (e.target.value === SPECIFIC_USER_OR_GROUP) {
      setSpecificUserGroup(e.target.value);
    } else {
      setSpecificUserGroup("");
      setSelectUserGroupIcon("");
      setIdentifierId("");
    }
  };

  const toggleDrawer = () => {
    setOpenFilterDrawer(!openFilterDrawer);
    !openFilterDrawer ? setFilterSelectedForEdit(false) : null;
  };

  const toggleModal = () => {
    setModalShow(!modalShow);
    setOpenFilterDrawer(!openFilterDrawer);
  };

  const list = () => (
    <div style={{ marginTop: "45px" }} role="presentation">
      <List>
        <div className="newFilterTaskContainer-header p-0 d-flex align-items-center justify-content-between ">
          <h5 style={{ fontWeight: "bold", fontSize: "16px" }}>
            <Translation>{(t) => t("Create new filter")}</Translation>
          </h5>
          <span
            className="cursor-pointer"
            style={{ fontSize: "14px" }}
            onClick={() => {
              toggleDrawer();
            }}
          >
            <Translation>{(t) => t("Close")}</Translation>
          </span>
        </div>
      </List>
      <List>
        <h5 style={{ fontWeight: "bold", fontSize: "18px" }}>
          <Translation>{(t) => t("Filter Name")}</Translation>
        </h5>
        <input
          type="text"
          placeholder={t("Enter your text here")}
          className="filter-name-textfeild"
          value={filterName}
          onChange={(e) => setFilterName(e.target.value)}
        />
      </List>
      <Divider />
      <List>
        <h5 style={{ fontWeight: "bold", fontSize: "18px" }}>
          <Translation>{(t) => t("Criteria")}</Translation>{" "}
          <i className="fa fa-info-circle"></i>{" "}
        </h5>
        <h5 style={{ fontSize: "18px" }}>
          <Translation>{(t) => t("Definition Key")}</Translation>
        </h5>
        <span
          style={{
            textDecoration: "underline",
            fontSize: "14px",
          }}
          onClick={() => handleSpanClick(1)}
          className="px-1 py-1 cursor-pointer"
        >
          <i className="fa fa-plus-circle" style={{ marginRight: "6px" }} />
          <Translation>{(t) => t("Add Value")}</Translation>
        </span>
        {inputVisibility[1] && (
          <input
            type="text"
            className="criteria-add-value-inputbox"
            value={definitionKeyId}
            name="definitionKeyId"
            onChange={(e) => setDefinitionKeyId(e.target.value)}
          />
        )}
        <h5>
          <Translation>{(t) => t("Candidate Group")}</Translation>
        </h5>
        <span
          style={{
            textDecoration: "underline",
            fontSize: "14px",
          }}
          onClick={() => handleSpanClick(2)}
          className="px-1 py-1 cursor-pointer"
        >
          <i className="fa fa-plus-circle" style={{ marginRight: "6px" }} />
          <Translation>{(t) => t("Add Value")}</Translation>
        </span>
        {inputVisibility[2] && (
          <input
            type="text"
            className="criteria-add-value-inputbox"
            value={candidateGroup}
            onChange={(e) => setCandidateGroup(e.target.value)}
          />
        )}
        <h5>
          <Translation>{(t) => t("Asignee")}</Translation>
        </h5>
        <span
          style={{
            textDecoration: "underline",
            fontSize: "14px",
          }}
          onClick={() => handleSpanClick(3)}
          className="px-1 py-1 cursor-pointer"
        >
          <i className="fa fa-plus-circle" style={{ marginRight: "6px" }} />
          <Translation>{(t) => t("Add Value")}</Translation>
        </span>
        {inputVisibility[3] && (
          <input
            type="text"
            className="criteria-add-value-inputbox"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          />
        )}

        {candidateGroup?.length ? (
          <div
            style={{ display: "flex", alignItems: "center", marginTop: "10px" }}
          >
            <input
              type="checkbox"
              id="assignedTask-checkbox"
              checked={includeAssignedTasks}
              onChange={includeAssignedTasksCheckboxChange}
              style={{ marginRight: "6px" }}
            />
            <h5 style={{ fontSize: "18px", marginBottom: "3px" }}>
              <Translation>{(t) => t("Include Assigned Task")}</Translation>
            </h5>
          </div>
        ) : null}
        <Divider />

        <Divider />
        <div className="child-container-two">
          <h5 style={{ fontWeight: "bold" }}>
            <Translation>{(t) => t("Permission")}</Translation>{" "}
            <i className="fa fa-info-circle"></i>
          </h5>
          <input
            style={{ marginRight: "4px" }}
            type="radio"
            id="my-radio"
            name="my-radio"
            value={ACCESSIBLE_FOR_ALL_GROUPS}
            checked={permissions === ACCESSIBLE_FOR_ALL_GROUPS}
            onChange={(e) => setPermissions(e.target.value)}
          />
          <label style={{ marginRight: "3px", fontSize: "18px" }}>
            <Translation>{(t) => t("Accessible for all users")}</Translation>
          </label>{" "}
          <br />
          <input
            style={{ marginRight: "4px" }}
            type="radio"
            id="my-radio"
            name="my-radio"
            value={PRIVATE_ONLY_YOU}
            checked={permissions === PRIVATE_ONLY_YOU}
            onChange={(e) => setPermissions(e.target.value)}
          />
          <label style={{ fontSize: "18px" }}>
            <Translation>{(t) => t("Private (Only You)")}</Translation>
          </label>
          <br />
          <input
            style={{ marginRight: "4px" }}
            type="radio"
            id="my-radio"
            name="my-radio"
            value={SPECIFIC_USER_OR_GROUP}
            checked={permissions === SPECIFIC_USER_OR_GROUP}
            onChange={handleSpecificUserGroup}
          />
          <label style={{ fontSize: "18px" }}>
            <Translation>{(t) => t("Specific User/ Group")}</Translation>
          </label>{" "}
          <br />
          {specificUserGroup === SPECIFIC_USER_OR_GROUP ? (
            <div className="inside-child-container-two d-flex">
              <div className="user-group-divisions d-flex">
                <div style={{ fontSize: "14px" }}>
                  <Translation>{(t) => t("User")}</Translation>
                  <i
                    className={`fa fa-user ${
                      selectUserGroupIcon === "user" ? "highlight" : ""
                    } cursor-pointer`}
                    style={{ fontSize: "30px" }}
                    onClick={() => handleClickUserGroupIcon("user")}
                  />
                </div>
                <div style={{ fontSize: "14px" }}>
                  <Translation>{(t) => t("Group")}</Translation>
                  <i
                    className={`fa fa-users ${
                      selectUserGroupIcon === "group" ? "highlight" : ""
                    } cursor-pointer`}
                    style={{ fontSize: "30px" }}
                    onClick={() => handleClickUserGroupIcon("group")}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "16px" }}>
                  <Translation>{(t) => t("Identifier")}</Translation>
                </label>
                <input
                  type="text"
                  placeholder={t("Enter role ID")}
                  style={{ width: "100%", height: "35px" }}
                  value={identifierId}
                  onChange={(e) => setIdentifierId(e.target.value)}
                />
              </div>
            </div>
          ) : null}
        </div>
        <Divider />
        <div className="m-2">
          <h5 className="font-weight-bold ">
            <Translation>{(t) => t("Task attribute")}</Translation>{" "}
            <i className="fa fa-info-circle"></i>
          </h5>
          <input
            readOnly
            type="text"
            className="filter-name-textfeild cursor-pointer"
            onClick={toggleModal}
            placeholder={
              taskAttributesCount === 0
                ? "Select elements"
                : taskAttributesCount + " Task attribute selected"
            }
          />
        </div>
        <Divider />
      </List>

      <List>
        <div className="newFilterTaskContainer-footer d-flex align-items-center justify-content-between">
          {selectedFilterData && (
            <button
              className="btn btn-link text-danger cursor-pointer"
              onClick={() => {
                toggleDrawer();
                handleFilterDelete();
              }}
            >
              <Translation>{(t) => t("Delete Filter")}</Translation>
            </button>
          )}
          <div className="d-flex align-items-center">
            <button
              className="btn btn-outline-secondary mr-3"
              onClick={() => {
                toggleDrawer();
              }}
            >
              <Translation>{(t) => t("Cancel")}</Translation>
            </button>
            <button
              className="btn btn-primary submitButton"
              style={{ textDecoration: "none", fontSize: "14px" }}
              onClick={() => {
                handleSubmit();
              }}
            >
              <Translation>
                {(t) => t(`${selectedFilterData ? "Save" : "Create"} Filter`)}
              </Translation>
            </button>
          </div>
        </div>
      </List>
    </div>
  );
  return (
    <div>
      <React.Fragment key="left">
        <button
          onClick={() => {
            toggleDrawer();
            clearAllFilters();
          }}
          className="btn btn-link text-dark cursor-pointer"
        >
          <Translation>{(t) => t("Create New Filter")}</Translation>
        </button>
        {modalShow && (
          <div>
            <TaskAttributeComponent
              show={modalShow}
              onHide={toggleModal}
              checkboxes={checkboxes}
              setCheckboxes={setCheckboxes}
              inputValues={inputValues}
              setInputValues={setInputValues}
              showUndefinedVariable={showUndefinedVariable}
              setShowUndefinedVariable={setShowUndefinedVariable}
            />
          </div>
        )}
        <Drawer
          anchor="left"
          open={openFilterDrawer}
          onClose={() => {
            toggleDrawer();
          }}
          PaperProps={{
            style: {
              width: "400px",
              padding: "2%",
              overflowY: "auto",
              overflowX: "hidden",
              backdropFilter: " none !important",
              zIndex: 1400,
            },
          }}
          sx={{
            width: 100,
          }}
        >
          {list("le ft")}
        </Drawer>
      </React.Fragment>
    </div>
  );
}