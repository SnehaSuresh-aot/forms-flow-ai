import React, {useEffect} from "react";
import {Row, Tab, Tabs} from "react-bootstrap";
import TaskHeader from "./TaskHeader";
import {setBPMTaskDetailLoader, setSelectedTaskID} from "../../../actions/bpmTaskActions";
import {fetchServiceTaskList, getBPMTaskDetail, onBPMTaskFormSubmit} from "../../../apiManager/services/bpmTaskServices";
import {useDispatch, useSelector} from "react-redux";
import Loading from "../../../containers/Loading";
import ProcessDiagram from "../../BPMN/ProcessDiagramHook";
import {getFormIdSubmissionIdFromURL, getProcessDataFromList} from "../../../apiManager/services/formatterService";
import History from "../../Application/ApplicationHistory";
import FormEdit from "../../Form/Item/Submission/Item/Edit";
import FormView from "../../Form/Item/Submission/Item/View";
import LoadingOverlay from "react-loading-overlay";
import {getForm, getSubmission} from "react-formio";
import {CUSTOM_EVENT_TYPE} from "../constants/customEventTypes";
import {getTaskSubmitFormReq} from "../../../apiManager/services/bpmServices";


const ServiceFlowTaskDetails = () => {

  const bpmTaskId = useSelector(state => state.bpmTasks.taskId);
  const task = useSelector(state => state.bpmTasks.taskDetail);
  const processList = useSelector(state=>state.bpmTasks.processList);
  const isTaskLoading = useSelector(state => state.bpmTasks.isTaskDetailLoading);
  const isTaskUpdating = useSelector(state => state.bpmTasks.isTaskDetailUpdating);
  const dispatch= useDispatch();
  const currentUser = useSelector((state) => state.user?.userDetail?.preferred_username || '');
  const selectedFilter=useSelector(state=>state.bpmTasks.selectedFilter);

  useEffect(()=>{
    if(bpmTaskId){
      dispatch(setBPMTaskDetailLoader(true))
      dispatch(getBPMTaskDetail(bpmTaskId));
    }
  },[bpmTaskId, dispatch]);


  useEffect(()=>{
    if(task?.formUrl){
      const {formId,submissionId} =getFormIdSubmissionIdFromURL(task?.formUrl);
      dispatch(getForm('form',formId));
      dispatch(getSubmission('submission', submissionId, formId))
    }
  },[task, dispatch]);

  const reloadTasks = () => {
    dispatch(setBPMTaskDetailLoader(true));
    dispatch(setSelectedTaskID(null)); // unSelect the Task Selected
    dispatch(fetchServiceTaskList(selectedFilter.id)); //Refreshes the Tasks
  }

  const reloadCurrentTask = () => {
    if(selectedFilter) {
      dispatch(setBPMTaskDetailLoader(true))
      dispatch(getBPMTaskDetail(task.id)); // Refresh the Task Selected
      dispatch(fetchServiceTaskList(selectedFilter.id)); //Refreshes the Tasks
    }
  }

  const onCustomEventCallBack = (customEvent) => {
     switch(customEvent.type){
       case CUSTOM_EVENT_TYPE.RELOAD_TASKS:
         reloadTasks();
         break;
       case CUSTOM_EVENT_TYPE.RELOAD_CURRENT_TASK:
         reloadCurrentTask();
         break;
       default: return;
     }
  };

  const onFormSubmitCallback = () => {
    if(bpmTaskId){
      console.log("to call form Submit")
      dispatch(onBPMTaskFormSubmit(bpmTaskId,getTaskSubmitFormReq(task?.formUrl,task?.applicationId)));
    }
    reloadCurrentTask();
  }

   if(!bpmTaskId){
     return <Row className="not-selected mt-2 ml-1">
       <i className="fa fa-info-circle mr-2 mt-1"/>
       Select a task in the list.
       </Row>
   }else if(isTaskLoading) {
   return <div className="service-task-details">
     <Loading/>
   </div>
   }else{
     /*TODO split render*/
     return (<div className="service-task-details">
       <LoadingOverlay
         active={isTaskUpdating}
         spinner
         text="Loading..."
       >
       <TaskHeader task={task}/>
       <Tabs defaultActiveKey="form" id="service-task-details" mountOnEnter>
         <Tab eventKey="form" title="Form">
           <LoadingOverlay active={task?.assignee!==currentUser}>
             {task?.assignee===currentUser?<FormEdit onFormSubmit={onFormSubmitCallback} onCustomEvent={onCustomEventCallBack}/>:<FormView showPrintButton={false}/>}
           </LoadingOverlay>
         </Tab>
         <Tab eventKey="history" title="History">
           <History applicationId={task?.applicationId}/>
         </Tab>
         <Tab eventKey="diagram" title="Diagram">
           <div>
             <ProcessDiagram
               process_key={getProcessDataFromList(processList, task?.processDefinitionId,'key')}
               // markers={processActivityList}
             />
           </div>
         </Tab>
       </Tabs>
       </LoadingOverlay>
     </div>)
   }
};

export default ServiceFlowTaskDetails;
