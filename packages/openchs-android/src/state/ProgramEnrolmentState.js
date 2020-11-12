import AbstractDataEntryState from "./AbstractDataEntryState";
import {ProgramConfig, ProgramEnrolment, ObservationsHolder} from 'avni-models';
import _ from 'lodash';
import ConceptService from "../service/ConceptService";
import IndividualService from "../service/IndividualService";

class ProgramEnrolmentState extends AbstractDataEntryState {
    static UsageKeys = {
        Enrol: 'Enrol',
        Exit: 'Exit'
    };

    constructor(validationResults, formElementGroup, wizard, usage, enrolment, isNewEnrolment, filteredFormElements, workLists) {
        super(validationResults, formElementGroup, wizard, isNewEnrolment, filteredFormElements, workLists);
        this.usage = usage;
        this.enrolment = enrolment;
        if (!_.isNil(enrolment)) {
            this.applicableObservationsHolder = new ObservationsHolder(ProgramEnrolmentState.UsageKeys.Enrol ? enrolment.observations : enrolment.programExitObservations);
        }
    }

    getEntity() {
        return this.enrolment;
    }

    getEntityType() {
        return ProgramEnrolment.schema.name;
    }

    clone() {
        const newState = super.clone();
        newState.enrolment = this.enrolment.cloneForEdit();
        newState.newEnrolment = this.newEnrolment;
        newState.usage = this.usage;
        newState.applicableObservationsHolder = new ObservationsHolder(this.usage === ProgramEnrolmentState.UsageKeys.Enrol ? newState.enrolment.observations : newState.enrolment.programExitObservations);
        return newState;
    }

    getWorkContext() {
        return {
            subjectUUID: this.enrolment.individual.uuid,
            programEnrolmentUUID: this.enrolment.uuid,
            programName: this.enrolment.program.name,
        };
    }

    get observationsHolder() {
        return this.applicableObservationsHolder;
    }

    get staticFormElementIds() {
        const validationKeys = [];
        if (this.usage === ProgramEnrolmentState.UsageKeys.Enrol) {
            validationKeys.push(ProgramEnrolment.validationKeys.ENROLMENT_DATE);
            validationKeys.push(ProgramEnrolment.validationKeys.ENROLMENT_LOCATION);
        } else {
            validationKeys.push(ProgramEnrolment.validationKeys.EXIT_DATE);
            validationKeys.push(ProgramEnrolment.validationKeys.EXIT_LOCATION);
        }


        return this.wizard.isFirstPage() ? validationKeys : [];
    }

    static hasEnrolmentOrItsUsageChanged(state, action) {
        return _.isNil(state) ||
            _.isNil(state.enrolment) ||
            state.enrolment.uuid !== action.enrolment.uuid ||
            state.usage !== action.usage;
    }

    validateEntity(context) {
        let validationResults;
        if (this.usage === ProgramEnrolmentState.UsageKeys.Enrol) {
            validationResults = this.enrolment.validateEnrolment();
            const locationValidation = this.validateLocation(
                this.enrolment.enrolmentLocation,
                ProgramEnrolment.validationKeys.ENROLMENT_LOCATION,
                context
            );
            validationResults.push(locationValidation);
        } else {
            validationResults = this.enrolment.validateExit();
            const locationValidation = this.validateLocation(
                this.enrolment.exitLocation,
                ProgramEnrolment.validationKeys.EXIT_LOCATION,
                context
            );
            validationResults.push(locationValidation);
        }
        return validationResults;
    }

    validateEntityAgainstRule(ruleService) {
        return ruleService.validateAgainstRule(this.enrolment, this.formElementGroup.form, ProgramEnrolment.schema.name);
    }

    executeRule(ruleService, context) {
        let decisions = ruleService.getDecisions(this.enrolment, ProgramEnrolment.schema.name, {usage: this.usage});
        if (this.usage === ProgramEnrolmentState.UsageKeys.Enrol) {
            context.get(ConceptService).addDecisions(this.enrolment.observations, decisions.enrolmentDecisions);
        } else {
            context.get(ConceptService).addDecisions(this.enrolment.programExitObservations, decisions.enrolmentDecisions);
        }

        return decisions;
    }

    getChecklists(ruleService, context) {
        if (this.usage === ProgramEnrolmentState.UsageKeys.Enrol) {
            return ruleService.getChecklists(this.enrolment, this.getEntityType(), this.enrolment.getChecklists());
        } else {
            return null;
        }
    }

    getNextScheduledVisits(ruleService, context) {
        const programConfig = ruleService
            .findByKey("program.uuid", this.enrolment.program.uuid, ProgramConfig.schema.name);
        if (this.usage === ProgramEnrolmentState.UsageKeys.Enrol) {
            const nextScheduledVisits =  ruleService.getNextScheduledVisits(this.enrolment, ProgramEnrolment.schema.name,
                [..._.get(programConfig, "visitSchedule", [])]
                    .map(k => _.assignIn({}, k)));
            return context.get(IndividualService).validateAndInjectOtherSubjectForScheduledVisit(this.enrolment.individual, nextScheduledVisits);
        } else {
            return null;
        }

    }

    static isInitialised(programEnrolmentState) {
        return !_.isNil(programEnrolmentState.enrolment);
    }

    getEffectiveDataEntryDate() {
        return this.enrolment.enrolmentDateTime;
    }
}

export default ProgramEnrolmentState;
