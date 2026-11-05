import { WorkspaceSession } from './state';
import { initializeAccountEvents } from './account-events';
import { initializeContexts } from './contexts';
import { createPrimitives, initializePrimitives } from './primitives';
import { createPersistence, initializePersistence } from './persistence';
import { createFeedback } from './feedback';
import { createSelectors, initializeSelectors } from './selectors';
import { createEntryFields } from './entry-fields';
import { createPurchases } from './purchases';
import { createCharts, initializeCharts } from './charts';
import { createCalendar } from './calendar';
import { createNavigation, initializeNavigation } from './navigation';
import { initializeActions } from './actions';
import { createEntrySheet, initializeEntrySheet } from './entry-sheet';
import {
  createNavigationEvents,
  initializeNavigationEvents,
} from './navigation-events';
import { createAppearance, initializeAppearance } from './appearance';
import { createReports } from './reports';
import { createProfile, initializeProfile } from './profile';
import { initializeProfileEvents } from './profile-events';
import { createSettings } from './settings';
import {
  createAccountOverlay,
  initializeAccountOverlay,
} from './account-overlay';
import { createPurchaseForm, initializePurchaseForm } from './purchase-form';
import { createSplits, initializeSplits } from './splits';
import { createCsvPreview, initializeCsvPreview } from './csv-preview';
import { createSplitForm, initializeSplitForm } from './split-form';
import { createNotifications, initializeNotifications } from './notifications';
import { createExports, initializeExports } from './exports';
import { createSummary, initializeSummary } from './summary';
import { createReceipt, initializeReceipt } from './receipt';
import { createUsername, initializeUsername } from './username';
import { createOfferSearch, initializeOfferSearch } from './offer-search';
import { createBehavior, initializeBehavior } from './behavior';
import { createSplitChart, initializeSplitChart } from './split-chart';
import {
  createSynchronization,
  initializeSynchronization,
} from './synchronization';
import { createIncomingDebt } from './incoming-debt';
import { initializeServices } from './services';
import { initializeCompletion } from './completion';

export function initializeWorkspace(workspace: WorkspaceSession) {
  Object.assign(workspace, createPrimitives(workspace));
  Object.assign(workspace, createPersistence(workspace));
  Object.assign(workspace, createFeedback(workspace));
  Object.assign(workspace, createSelectors(workspace));
  Object.assign(workspace, createEntryFields(workspace));
  Object.assign(workspace, createPurchases(workspace));
  Object.assign(workspace, createCharts(workspace));
  Object.assign(workspace, createCalendar(workspace));
  Object.assign(workspace, createNavigation(workspace));
  Object.assign(workspace, createEntrySheet(workspace));
  Object.assign(workspace, createNavigationEvents(workspace));
  Object.assign(workspace, createAppearance(workspace));
  Object.assign(workspace, createReports(workspace));
  Object.assign(workspace, createProfile(workspace));
  Object.assign(workspace, createSettings(workspace));
  Object.assign(workspace, createAccountOverlay(workspace));
  Object.assign(workspace, createPurchaseForm(workspace));
  Object.assign(workspace, createSplits(workspace));
  Object.assign(workspace, createCsvPreview(workspace));
  Object.assign(workspace, createSplitForm(workspace));
  Object.assign(workspace, createNotifications(workspace));
  Object.assign(workspace, createExports(workspace));
  Object.assign(workspace, createSummary(workspace));
  Object.assign(workspace, createReceipt(workspace));
  Object.assign(workspace, createUsername(workspace));
  Object.assign(workspace, createOfferSearch(workspace));
  Object.assign(workspace, createBehavior(workspace));
  Object.assign(workspace, createSplitChart(workspace));
  Object.assign(workspace, createSynchronization(workspace));
  Object.assign(workspace, createIncomingDebt(workspace));
  initializeAccountEvents(workspace);
  initializeContexts(workspace);
  initializePrimitives(workspace);
  initializePersistence(workspace);
  initializeSelectors(workspace);
  initializeCharts(workspace);
  initializeNavigation(workspace);
  initializeActions(workspace);
  initializeEntrySheet(workspace);
  initializeNavigationEvents(workspace);
  initializeAppearance(workspace);
  initializeProfile(workspace);
  initializeProfileEvents(workspace);
  initializeAccountOverlay(workspace);
  initializePurchaseForm(workspace);
  initializeSplits(workspace);
  initializeCsvPreview(workspace);
  initializeSplitForm(workspace);
  initializeNotifications(workspace);
  initializeExports(workspace);
  initializeSummary(workspace);
  initializeReceipt(workspace);
  initializeUsername(workspace);
  initializeOfferSearch(workspace);
  initializeBehavior(workspace);
  initializeSplitChart(workspace);
  initializeSynchronization(workspace);
  initializeServices(workspace);
  initializeCompletion(workspace);
}
