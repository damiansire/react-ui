import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import Table from "./Table";

// You can learn about this: https://storybook.js.org/docs/react/writing-stories/introduction

export default {
  title: "Table",
  component: Table,
} as ComponentMeta<typeof Table>;

const Template: ComponentStory<typeof Table> = (args) => <Table {...args} />;

const data = [
  {
    id: "1",
    name: "Item 1",
    description: "Description of Item 1",
    amount: 10.99,
  },
  {
    id: "2",
    name: "Item 2",
    description: "Description of Item 2",
    amount: 5.49,
  },
  {
    id: "3",
    name: "Item 3",
    description: "Description of Item 3",
    amount: 20.0,
  },
  {
    id: "4",
    name: "Item 4",
    description: "Description of Item 4",
    amount: 8.75,
  },
  {
    id: "5",
    name: "Item 5",
    description: "Description of Item 5",
    amount: 15.25,
  },
];

const headers = [
  { attributeName: "name", displayText: "Nombre" },
  { attributeName: "description", displayText: "Descripción" },
  { attributeName: "amount", displayText: "Cantidad" },
];

export const Primary = Template.bind({});
Primary.args = {
  headers: headers,
  rows: data,
};
