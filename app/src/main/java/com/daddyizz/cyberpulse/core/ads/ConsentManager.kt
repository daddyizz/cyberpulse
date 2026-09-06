package com.daddyizz.cyberpulse.core.ads

import android.app.Activity
import android.content.Context
import com.google.android.ump.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Manages Google User Messaging Platform (UMP) consent flows,
 * GDPR / ePrivacy compliance, and Privacy Choices form presentations.
 */
class ConsentManager(private val context: Context) {

    private val consentInformation: ConsentInformation =
        UserMessagingPlatform.getConsentInformation(context)

    private val _canRequestAds = MutableStateFlow(consentInformation.canRequestAds())
    val canRequestAds: StateFlow<Boolean> = _canRequestAds.asStateFlow()

    private val _isPrivacyOptionsRequired = MutableStateFlow(
        consentInformation.privacyOptionsRequirementStatus == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED
    )
    val isPrivacyOptionsRequired: StateFlow<Boolean> = _isPrivacyOptionsRequired.asStateFlow()

    /**
     * Gathers initial user consent at launch.
     * Must be called during Activity initialization before requesting ads.
     */
    fun gatherConsent(
        activity: Activity,
        onConsentGathered: (canRequestAds: Boolean) -> Unit = {}
    ) {
        val params = ConsentRequestParameters.Builder()
            .setTagForUnderAgeOfConsent(false)
            .build()

        consentInformation.requestConsentInfoUpdate(
            activity,
            params,
            {
                UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity) { formError ->
                    updateConsentStatus()
                    onConsentGathered(consentInformation.canRequestAds())
                }
            },
            { requestConsentError ->
                // If offline or request fails, check if previously stored consent exists
                updateConsentStatus()
                onConsentGathered(consentInformation.canRequestAds())
            }
        )
    }

    /**
     * Shows the Privacy Choices / Consent form again when requested by user in Settings.
     */
    fun showPrivacyOptionsForm(activity: Activity, onDismissed: () -> Unit = {}) {
        UserMessagingPlatform.showPrivacyOptionsForm(activity) { formError ->
            updateConsentStatus()
            onDismissed()
        }
    }

    private fun updateConsentStatus() {
        _canRequestAds.value = consentInformation.canRequestAds()
        _isPrivacyOptionsRequired.value =
            consentInformation.privacyOptionsRequirementStatus == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED
    }
}
