package com.predictive.maintenance.config;

import com.predictive.maintenance.service.MqttTelemetryIngestionService;
import lombok.RequiredArgsConstructor;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.core.MessageProducer;
import org.springframework.integration.mqtt.core.DefaultMqttPahoClientFactory;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.inbound.MqttPahoMessageDrivenChannelAdapter;
import org.springframework.integration.mqtt.support.DefaultPahoMessageConverter;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;

@Configuration
@ConditionalOnProperty(name = "app.mqtt.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
public class MqttConfig {

    private static final Logger log = LoggerFactory.getLogger(MqttConfig.class);

    @Value("${app.mqtt.broker-url:tcp://localhost:1883}")
    private String brokerUrl;

    @Value("${app.mqtt.client-id:ipm-backend-subscriber}")
    private String clientId;

    @Value("${app.mqtt.topic-pattern:factory/+/sensor/+}")
    private String topicPattern;

    @Value("${app.mqtt.username:}")
    private String username;

    @Value("${app.mqtt.password:}")
    private String password;

    private final MqttTelemetryIngestionService telemetryIngestionService;

    @Bean
    public MqttPahoClientFactory mqttClientFactory() {
        DefaultMqttPahoClientFactory factory = new DefaultMqttPahoClientFactory();
        MqttConnectOptions options = new MqttConnectOptions();
        options.setServerURIs(new String[] { brokerUrl });
        options.setCleanSession(true);
        options.setAutomaticReconnect(true);
        options.setConnectionTimeout(10);
        options.setKeepAliveInterval(60);

        if (username != null && !username.trim().isEmpty()) {
            options.setUserName(username.trim());
        }
        if (password != null && !password.trim().isEmpty()) {
            options.setPassword(password.trim().toCharArray());
        }

        factory.setConnectionOptions(options);
        log.info("Configured MQTT Client Factory for Broker [{}] with Topic Pattern [{}]", brokerUrl, topicPattern);
        return factory;
    }

    @Bean
    public MessageChannel mqttInputChannel() {
        return new DirectChannel();
    }

    @Bean
    public MessageProducer mqttInboundAdapter() {
        MqttPahoMessageDrivenChannelAdapter adapter =
                new MqttPahoMessageDrivenChannelAdapter(clientId, mqttClientFactory(), topicPattern.split(","));

        adapter.setCompletionTimeout(5000);
        adapter.setConverter(new DefaultPahoMessageConverter());
        adapter.setQos(1);
        adapter.setOutputChannel(mqttInputChannel());
        
        log.info("Initialized MQTT Inbound Adapter subscribing to topics [{}]", topicPattern);
        return adapter;
    }

    @Bean
    @ServiceActivator(inputChannel = "mqttInputChannel")
    public MessageHandler mqttMessageHandler() {
        return new MessageHandler() {
            @Override
            public void handleMessage(Message<?> message) {
                String payload = message.getPayload().toString();
                String topic = (String) message.getHeaders().get(MqttHeaders.RECEIVED_TOPIC);

                try {
                    telemetryIngestionService.processTelemetryPayload(topic, payload);
                } catch (Exception e) {
                    log.error("Unhandled exception during MQTT message ingestion on topic [{}]: {}", topic, e.getMessage(), e);
                }
            }
        };
    }
}
