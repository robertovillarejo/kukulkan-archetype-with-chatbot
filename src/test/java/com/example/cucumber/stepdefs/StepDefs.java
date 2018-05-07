package com.example.cucumber.stepdefs;

import com.example.JpaApp;

import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.ResultActions;

import org.springframework.boot.test.context.SpringBootTest;

@WebAppConfiguration
@SpringBootTest
@ContextConfiguration(classes = JpaApp.class)
public abstract class StepDefs {

    protected ResultActions actions;

}
