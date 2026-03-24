import { auth, db } from '@/lib/firebase';
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    setDoc,
    where,
} from 'firebase/firestore';

const ORDER_TEMPLATES_COLLECTION = 'orderTemplates';
const ORDER_TEMPLATES_STORAGE_KEY = 'orderTemplates';
const FACILITY_ORDER_TEMPLATE_TYPE = 'facility-order-template';

export const ORDER_TEMPLATES_UPDATED_EVENT = 'orderTemplatesUpdated';

function getSavedAtTime(template) {
    const value = template?.savedAt ? new Date(template.savedAt).getTime() : 0;
    return Number.isNaN(value) ? 0 : value;
}

function sanitizeForFirestore(value) {
    if (Array.isArray(value)) {
        return value
            .map(item => sanitizeForFirestore(item))
            .filter(item => item !== undefined);
    }

    if (value && typeof value === 'object') {
        return Object.entries(value).reduce((result, [key, item]) => {
            if (item === undefined) {
                return result;
            }

            result[key] = sanitizeForFirestore(item);
            return result;
        }, {});
    }

    return value;
}

function readAllStoredTemplates() {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        return JSON.parse(localStorage.getItem(ORDER_TEMPLATES_STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

function emitTemplatesUpdated() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(ORDER_TEMPLATES_UPDATED_EVENT));
    }
}

function writeAllStoredTemplates(templates, { emit = true } = {}) {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.setItem(ORDER_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));

    if (emit) {
        emitTemplatesUpdated();
    }
}

function getCurrentTemplateOwner() {
    if (typeof window !== 'undefined') {
        try {
            const demoUser = JSON.parse(localStorage.getItem('demoUser') || 'null');
            if (demoUser?.uid) {
                return demoUser;
            }
        } catch {
            // Ignore invalid demo user state and fall back to auth.
        }
    }

    if (auth.currentUser?.uid) {
        return {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email || '',
            role: 'facility',
        };
    }

    return null;
}

export function isFacilityOrderTemplate(template) {
    if (!template || typeof template !== 'object') {
        return false;
    }

    if (template.templateType === FACILITY_ORDER_TEMPLATE_TYPE) {
        return true;
    }

    return Boolean(template.formatId || template.formatSnapshot || template.customValues);
}

export function sortOrderTemplatesBySavedAt(templates = []) {
    return [...templates].sort((left, right) => getSavedAtTime(right) - getSavedAtTime(left));
}

export function readStoredFacilityOrderTemplates() {
    const owner = getCurrentTemplateOwner();

    return sortOrderTemplatesBySavedAt(
        readAllStoredTemplates()
            .filter(isFacilityOrderTemplate)
            .filter(template => !owner?.uid || !template.ownerId || template.ownerId === owner.uid),
    );
}

function writeStoredFacilityOrderTemplates(templates, options = {}) {
    const owner = getCurrentTemplateOwner();
    const otherTemplates = readAllStoredTemplates().filter(template => {
        if (!isFacilityOrderTemplate(template)) {
            return true;
        }

        if (!owner?.uid) {
            return false;
        }

        return Boolean(template.ownerId && template.ownerId !== owner.uid);
    });

    writeAllStoredTemplates(
        [...sortOrderTemplatesBySavedAt(templates), ...otherTemplates],
        options,
    );
}

function normalizeTemplate(template, owner = getCurrentTemplateOwner()) {
    return {
        ...template,
        id: template.id,
        savedAt: template.savedAt || new Date().toISOString(),
        templateType: FACILITY_ORDER_TEMPLATE_TYPE,
        ownerId: owner?.uid || template.ownerId || '',
        ownerEmail: owner?.email || template.ownerEmail || '',
        ownerRole: owner?.role || template.ownerRole || 'facility',
    };
}

function mergeTemplates(remoteTemplates, localTemplates) {
    const merged = new Map(remoteTemplates.map(template => [template.id, template]));

    localTemplates.forEach(template => {
        const current = merged.get(template.id);
        if (!current || getSavedAtTime(template) >= getSavedAtTime(current)) {
            merged.set(template.id, template);
        }
    });

    return sortOrderTemplatesBySavedAt(Array.from(merged.values()));
}

function getTemplatesToUpload(localTemplates, remoteTemplates) {
    const remoteById = new Map(remoteTemplates.map(template => [template.id, template]));

    return localTemplates.filter(template => {
        const remoteTemplate = remoteById.get(template.id);
        return !remoteTemplate || getSavedAtTime(template) > getSavedAtTime(remoteTemplate);
    });
}

function upsertTemplate(templates, nextTemplate) {
    return sortOrderTemplatesBySavedAt([
        nextTemplate,
        ...templates.filter(template => template.id !== nextTemplate.id),
    ]);
}

export async function loadFacilityOrderTemplates() {
    const owner = getCurrentTemplateOwner();
    const localTemplates = readStoredFacilityOrderTemplates();

    if (!owner?.uid) {
        return localTemplates;
    }

    try {
        const snapshot = await getDocs(
            query(
                collection(db, ORDER_TEMPLATES_COLLECTION),
                where('ownerId', '==', owner.uid),
            ),
        );

        const remoteTemplates = snapshot.docs
            .map(item => normalizeTemplate({ id: item.id, ...item.data() }, owner))
            .filter(isFacilityOrderTemplate);

        const templatesToUpload = getTemplatesToUpload(localTemplates, remoteTemplates);

        if (templatesToUpload.length > 0) {
            await Promise.all(
                templatesToUpload.map(template =>
                    setDoc(
                        doc(db, ORDER_TEMPLATES_COLLECTION, template.id),
                        sanitizeForFirestore(normalizeTemplate(template, owner)),
                    ),
                ),
            );
        }

        const mergedTemplates = mergeTemplates(remoteTemplates, localTemplates).map(template =>
            normalizeTemplate(template, owner),
        );

        writeStoredFacilityOrderTemplates(mergedTemplates, { emit: false });
        return mergedTemplates;
    } catch (error) {
        console.error('Failed to load facility order templates:', error);
        return localTemplates;
    }
}

export async function saveFacilityOrderTemplate(template) {
    const owner = getCurrentTemplateOwner();
    const normalizedTemplate = normalizeTemplate(template, owner);

    writeStoredFacilityOrderTemplates(
        upsertTemplate(readStoredFacilityOrderTemplates(), normalizedTemplate),
    );

    if (!owner?.uid) {
        return { template: normalizedTemplate, savedRemotely: false };
    }

    try {
        await setDoc(
            doc(db, ORDER_TEMPLATES_COLLECTION, normalizedTemplate.id),
            sanitizeForFirestore(normalizeTemplate(normalizedTemplate, owner)),
        );

        return { template: normalizedTemplate, savedRemotely: true };
    } catch (error) {
        console.error('Failed to save facility order template:', error);
        return { template: normalizedTemplate, savedRemotely: false, error };
    }
}

export async function deleteFacilityOrderTemplate(templateId) {
    const owner = getCurrentTemplateOwner();

    if (owner?.uid) {
        try {
            await deleteDoc(doc(db, ORDER_TEMPLATES_COLLECTION, templateId));
        } catch (error) {
            console.error('Failed to delete facility order template:', error);
            return { deletedRemotely: false, error };
        }
    }

    writeStoredFacilityOrderTemplates(
        readStoredFacilityOrderTemplates().filter(template => template.id !== templateId),
    );

    return { deletedRemotely: Boolean(owner?.uid) };
}
