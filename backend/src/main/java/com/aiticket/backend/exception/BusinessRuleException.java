package com.aiticket.backend.exception;

/** Operação válida sintaticamente, mas não permitida pelo estado atual do chamado. */
public class BusinessRuleException extends RuntimeException {
    public BusinessRuleException(String message) {
        super(message);
    }
}
