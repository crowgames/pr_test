/* global done:false */
/* global error:false */
/* global PaymentRequest:false */

/**
 * Initializes the payment request object.
 */
function buildPaymentRequest() {
  if (!window.PaymentRequest) {
    return null;
  }

  var supportedInstruments = [
    {
      supportedMethods: 'https://bobpay.xyz/pay'
    },
    {
      supportedMethods: 'https://test1.sec.uni-stuttgart.de/wepay/'
    },
    {
      supportedMethods: 'https://test1.sec.uni-stuttgart.de/payinator/'
    },
    {
      supportedMethods: 'https://rsolomakhin.github.io/pr/apps/pmc/'
    },
    {
    supportedMethods: 'https://google.com/pay',
    data: {
      allowedPaymentMethods: ['TOKENIZED_CARD', 'CARD'],
      apiVersion: 1,
      cardRequirements: {
        'allowedCardNetworks': ['VISA', 'MASTERCARD', 'AMEX'],
      },
      merchantName: 'Rouslan Solomakhin',
      merchantId: '00184145120947117657',
      paymentMethodTokenizationParameters: {
        tokenizationType: 'GATEWAY_TOKEN',
        parameters: {
          'gateway': 'stripe',
          'stripe:publishableKey': 'pk_live_lNk21zqKM2BENZENh3rzCUgo',
          'stripe:version': '2016-07-06',
        },
      },
    },
  },
  ];

  var details = {
    total: {
      label: 'Total',
      amount: {
        currency: 'USD',
        value: '1.00',
      },
    }
  };

  var options = {};

  var request = null;

  try {
    request = new PaymentRequest(supportedInstruments, details, options);
  } catch (e) {
    error("Developer mistake: '" + e + "'");
  }

  if (request.canMakePayment) {
    request
      .canMakePayment()
      .then(function(result) {
        info(result ? 'Can make payment' : 'Cannot make payment');
      })
      .catch(function(err) {
        error(err);
      });
  }

  return request;
}

var request = buildPaymentRequest();

/**
 * Launches payment request for credit cards.
 */
function onBuyClicked() {
  // eslint-disable-line no-unused-vars
  if (!window.PaymentRequest || !request) {
    error('PaymentRequest API is not supported.');
    return;
  }

  try {
    request
      .show()
      .then(function(instrumentResponse) {
        validateResponse(instrumentResponse)
          .then(function() {
            window.setTimeout(function() {
              instrumentResponse
                .complete('success')
                .then(function() {
                  done(
                    'This is a demo website. No payment will be processed.',
                    instrumentResponse,
                  );
                })
                .catch(function(err) {
                  error(err);
                  request = buildPaymentRequest();
                });
            }, 2000);
          });
      })
      .catch(function(err) {
        error(err);
        request = buildPaymentRequest();
      });
  } catch (e) {
    error("Developer mistake: '" + e + "'");
    request = buildPaymentRequest();
  }
}

var firstPaymentMethod = undefined;

function validateResponse(response) {
  return new Promise(resolver => {
    if (!response.retry) {
      error('PaymentResponse.retry() is not defined. Is chrome://flags/#enable-experimental-web-platform-features enabled?');
      return;
    }
	
	if(firstPaymentMethod === undefined){
		firstPaymentMethod = response.methodName;
		document.getElementById("explanation").style.display = "block";
	}
	
    window.setTimeout(function() {
      if (response.methodName == firstPaymentMethod) {
        response.retry({ error: response.methodName+' is currently unavailable. Please choose a different payment provider'})
          .then(function() {
            resolver(validateResponse(response));
          });
      } else {
        resolver();
      }
    }, 2000);
  });
}
