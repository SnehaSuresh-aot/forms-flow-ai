package org.camunda.bpm.extension.hooks.adapter.response;

import org.camunda.connect.spi.ConnectorResponse;

import java.util.Collections;
import java.util.Map;

public class EmptyResponse implements ConnectorResponse {

    @Override
    public Map<String, Object> getResponseParameters() {
        return Collections.emptyMap();
    }

    @Override
    public <V> V getResponseParameter(String name) {
        return null;
    }

}