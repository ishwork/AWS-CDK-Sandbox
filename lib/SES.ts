import { Construct } from 'constructs';
import { EmailIdentity, Identity, ConfigurationSet, CloudWatchDimensionSource, EmailSendingEvent, EventDestination } from 'aws-cdk-lib/aws-ses';

export class SimpleEmailService extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // const region = 'eu-west-1';

    // Create the configuration set
    const configurationSet = new ConfigurationSet(this, 'SESConfigurationSet', {
      configurationSetName: 'Engagement'
    });

    // Create the events
    const emailSendingEvents = [EmailSendingEvent.BOUNCE, EmailSendingEvent.COMPLAINT, EmailSendingEvent.DELIVERY, EmailSendingEvent.OPEN, EmailSendingEvent.CLICK, EmailSendingEvent.RENDERING_FAILURE, EmailSendingEvent.REJECT, EmailSendingEvent.SEND];

    // Create the event destination
    configurationSet.addEventDestination('CloudWatchDestination', {
      enabled: true,
      events: emailSendingEvents,
      configurationSetEventDestinationName: 'CloudWatchDestination',
      destination: EventDestination.cloudWatchDimensions([
        {
          defaultValue: 'unknown_domain',
          name: 'ses:from-domain',
          source: CloudWatchDimensionSource.MESSAGE_TAG,
        }
      ]),
    });

    // Create the email identity
    new EmailIdentity(this, 'EmailIdentity', {
      identity: Identity.email('ishwor.khadka@aller.com'),
      configurationSet: configurationSet,
    });
  }
}
