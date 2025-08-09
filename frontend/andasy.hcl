# andasy.hcl app configuration file generated for program-management on Saturday, 09-Aug-25 21:24:40 EET
#
# See https://github.com/quarksgroup/andasy-cli for information about how to use this file.

app_name = "program-management"

app {

  env = {}

  port = 3000

  compute {
    cpu      = 1
    memory   = 1024
    cpu_kind = "shared"
  }

  process {
    name = "program-management"
  }

}
