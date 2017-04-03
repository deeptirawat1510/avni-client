import BaseService from "./BaseService.js";
import Service from "../framework/bean/Service";
import Concept from "../models/Concept";
import _ from 'lodash';
import Observation from "../models/Observation";
import PrimitiveValue from "../models/observation/PrimitiveValue";

@Service("conceptService")
class ConceptService extends BaseService {
    constructor(db, beanStore) {
        super(db, beanStore);
        this.saveConcept = this.saveConcept.bind(this);
        this.getConceptByUUID = this.getConceptByUUID.bind(this);
    }

    getSchema() {
        return Concept.schema.name;
    }

    getConceptByUUID(conceptUUID) {
        return this.db.objectForPrimaryKey(Concept.schema.name, conceptUUID);
    }

    getAllConcepts() {
        return this.db.objects(Concept.schema.name);
    }

    getConceptByName(conceptName) {
        return this.db.objects(Concept.schema.name).filtered(`name = \"${conceptName}\"`)[0];
    }

    saveConcept(concept) {
        const db = this.db;
        this.db.write(() => db.create(Concept.schema.name, concept, true));
        return concept;
    }

    addDecisions(observations, decisions) {
        decisions.forEach((decision) => {
            const concept = this.findByKey('name', decision.name);
            if (_.isNil(concept))
                throw Error(`No concept found for ${decision.name} when adding observations for decisions`);
            observations.push(Observation.create(concept, new PrimitiveValue(decision.value)));
        });
    }
}

export default ConceptService;